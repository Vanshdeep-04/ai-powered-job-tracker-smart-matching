import storageService from '../services/storageService.js';

export default async function applicationsRoutes(fastify) {
    // Get all applications
    fastify.get('/', async (request, reply) => {
        const sessionId = request.headers['x-session-id'];
        const { status, sortBy = 'updatedAt', order = 'desc' } = request.query;

        if (!sessionId) {
            return reply.status(400).send({
                success: false,
                error: 'Session ID required'
            });
        }

        try {
            let applications = await storageService.getApplications(sessionId);

            // Filter by status if provided
            if (status && status !== 'all') {
                applications = applications.filter(app => app.status === status);
            }

            // Sort applications
            applications.sort((a, b) => {
                const aVal = a[sortBy] || a.createdAt;
                const bVal = b[sortBy] || b.createdAt;
                return order === 'desc'
                    ? new Date(bVal) - new Date(aVal)
                    : new Date(aVal) - new Date(bVal);
            });

            // Calculate stats
            const stats = {
                total: applications.length,
                applied: applications.filter(a => a.status === 'applied').length,
                interview: applications.filter(a => a.status === 'interview').length,
                offer: applications.filter(a => a.status === 'offer').length,
                rejected: applications.filter(a => a.status === 'rejected').length
            };

            return {
                success: true,
                applications,
                stats
            };
        } catch (error) {
            console.error('Applications fetch error:', error);
            reply.status(500).send({
                success: false,
                error: 'Failed to fetch applications'
            });
        }
    });

    // Add new application
    fastify.post('/', async (request, reply) => {
        const sessionId = request.headers['x-session-id'];
        const { jobId, jobTitle, company, applyLink, matchScore } = request.body;

        if (!sessionId) {
            return reply.status(400).send({
                success: false,
                error: 'Session ID required'
            });
        }

        if (!jobId || !jobTitle || !company) {
            return reply.status(400).send({
                success: false,
                error: 'Job details required (jobId, jobTitle, company)'
            });
        }

        try {
            const application = await storageService.saveApplication(sessionId, {
                jobId,
                jobTitle,
                company,
                applyLink,
                matchScore,
                status: 'applied',
                statusHistory: [
                    { status: 'applied', timestamp: new Date().toISOString() }
                ]
            });

            return {
                success: true,
                message: 'Application tracked successfully',
                application
            };
        } catch (error) {
            console.error('Application save error:', error);
            reply.status(500).send({
                success: false,
                error: 'Failed to save application'
            });
        }
    });

    // Update application status
    fastify.patch('/:applicationId', async (request, reply) => {
        const sessionId = request.headers['x-session-id'];
        const { applicationId } = request.params;
        const { status } = request.body;

        if (!sessionId) {
            return reply.status(400).send({
                success: false,
                error: 'Session ID required'
            });
        }

        const validStatuses = ['applied', 'interview', 'offer', 'rejected'];
        if (!status || !validStatuses.includes(status)) {
            return reply.status(400).send({
                success: false,
                error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }

        try {
            const updated = await storageService.updateApplicationStatus(
                sessionId,
                applicationId,
                status
            );

            return {
                success: true,
                message: 'Application status updated',
                application: updated
            };
        } catch (error) {
            console.error('Application update error:', error);

            if (error.message === 'Application not found') {
                return reply.status(404).send({
                    success: false,
                    error: 'Application not found'
                });
            }

            reply.status(500).send({
                success: false,
                error: 'Failed to update application'
            });
        }
    });

    // Delete application
    fastify.delete('/:applicationId', async (request, reply) => {
        const sessionId = request.headers['x-session-id'];
        const { applicationId } = request.params;

        if (!sessionId) {
            return reply.status(400).send({
                success: false,
                error: 'Session ID required'
            });
        }

        try {
            const applications = await storageService.getApplications(sessionId);
            const filtered = applications.filter(app => app.id !== applicationId);

            if (filtered.length === applications.length) {
                return reply.status(404).send({
                    success: false,
                    error: 'Application not found'
                });
            }

            // Save filtered list (this is a workaround - ideally storage would have a delete method)
            await storageService.saveApplication(sessionId, { _replace: filtered });

            return {
                success: true,
                message: 'Application deleted successfully'
            };
        } catch (error) {
            console.error('Application delete error:', error);
            reply.status(500).send({
                success: false,
                error: 'Failed to delete application'
            });
        }
    });
}
