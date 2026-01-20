import aiService from '../services/aiService.js';
import storageService from '../services/storageService.js';

export default async function resumeImprovementRoutes(fastify) {
    // Get resume improvement suggestions for a specific job
    fastify.post('/suggestions', async (request, reply) => {
        const { job, sessionId } = request.body;

        if (!job) {
            return reply.status(400).send({
                success: false,
                error: 'Job details are required'
            });
        }

        try {
            // Get resume if available
            const resume = sessionId ? await storageService.getResume(sessionId) : null;
            const resumeText = resume?.text || '';

            if (!resumeText) {
                return reply.status(400).send({
                    success: false,
                    error: 'Please upload your resume first to get improvement suggestions'
                });
            }

            // Get AI suggestions
            const suggestions = await aiService.getResumeImprovements(job, resumeText);

            return {
                success: true,
                suggestions
            };
        } catch (error) {
            console.error('Resume improvement error:', error);
            reply.status(500).send({
                success: false,
                error: 'Failed to generate suggestions'
            });
        }
    });
}
