import resumeParser from '../services/resumeParser.js';
import storageService from '../services/storageService.js';

export default async function resumeRoutes(fastify) {
    // Upload resume
    fastify.post('/', async (request, reply) => {
        try {
            const data = await request.file();

            if (!data) {
                return reply.status(400).send({
                    success: false,
                    error: 'No file uploaded'
                });
            }

            const { filename, mimetype } = data;
            const sessionId = request.headers['x-session-id'];

            if (!sessionId) {
                return reply.status(400).send({
                    success: false,
                    error: 'Session ID required'
                });
            }

            // Validate file type
            const allowedTypes = ['application/pdf', 'text/plain'];
            if (!allowedTypes.includes(mimetype)) {
                return reply.status(400).send({
                    success: false,
                    error: 'Invalid file type. Only PDF and TXT files are allowed.'
                });
            }

            // Read file buffer
            const buffer = await data.toBuffer();

            // Parse resume
            const parsed = await resumeParser.parse(buffer, filename);
            const cleanedText = resumeParser.cleanText(parsed.text);

            // Save to storage
            const saved = await storageService.saveResume(sessionId, {
                text: cleanedText,
                filename
            });

            return {
                success: true,
                message: 'Resume uploaded successfully',
                resume: {
                    filename: saved.filename,
                    uploadedAt: saved.uploadedAt,
                    textLength: saved.text.length
                }
            };
        } catch (error) {
            console.error('Resume upload error:', error);
            reply.status(500).send({
                success: false,
                error: error.message || 'Failed to upload resume'
            });
        }
    });

    // Get resume status
    fastify.get('/', async (request, reply) => {
        const sessionId = request.headers['x-session-id'];

        if (!sessionId) {
            return reply.status(400).send({
                success: false,
                error: 'Session ID required'
            });
        }

        try {
            const resume = await storageService.getResume(sessionId);

            if (!resume) {
                return {
                    success: true,
                    hasResume: false,
                    resume: null
                };
            }

            return {
                success: true,
                hasResume: true,
                resume: {
                    filename: resume.filename,
                    uploadedAt: resume.uploadedAt,
                    textLength: resume.text?.length || 0
                }
            };
        } catch (error) {
            console.error('Resume fetch error:', error);
            reply.status(500).send({
                success: false,
                error: 'Failed to fetch resume'
            });
        }
    });

    // Delete resume
    fastify.delete('/', async (request, reply) => {
        const sessionId = request.headers['x-session-id'];

        if (!sessionId) {
            return reply.status(400).send({
                success: false,
                error: 'Session ID required'
            });
        }

        try {
            await storageService.deleteResume(sessionId);

            return {
                success: true,
                message: 'Resume deleted successfully'
            };
        } catch (error) {
            console.error('Resume delete error:', error);
            reply.status(500).send({
                success: false,
                error: 'Failed to delete resume'
            });
        }
    });
}
