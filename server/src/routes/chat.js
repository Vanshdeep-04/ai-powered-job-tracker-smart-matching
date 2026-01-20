import aiService from '../services/aiService.js';
import storageService from '../services/storageService.js';

export default async function chatRoutes(fastify) {
    // Process chat message
    fastify.post('/', async (request, reply) => {
        const sessionId = request.headers['x-session-id'];
        const { message } = request.body;

        if (!message) {
            return reply.status(400).send({
                success: false,
                error: 'Message is required'
            });
        }

        try {
            // Build context for AI
            let resumeText = null;
            let applications = [];

            if (sessionId) {
                const resume = await storageService.getResume(sessionId);
                resumeText = resume?.text;
                applications = await storageService.getApplications(sessionId);
            }

            const context = {
                resumeText,
                applications,
                availableFilters: {
                    skills: ['React', 'Node.js', 'Python', 'JavaScript', 'TypeScript', 'Java', 'Go', 'AWS', 'Docker', 'Kubernetes'],
                    jobTypes: ['fulltime', 'parttime', 'contract', 'internship'],
                    workModes: ['remote', 'hybrid', 'onsite'],
                    datePosted: ['last24h', 'lastWeek', 'lastMonth', 'anytime']
                }
            };

            const response = await aiService.processChat(message, context);

            return {
                success: true,
                response: response.message,
                action: response.action
            };
        } catch (error) {
            console.error('Chat error:', error);
            reply.status(500).send({
                success: false,
                error: 'Failed to process chat message'
            });
        }
    });

    // Get chat suggestions
    fastify.get('/suggestions', async (request, reply) => {
        const suggestions = [
            "Show me remote React jobs",
            "Find Python developer positions",
            "Which jobs have highest match scores?",
            "Where do I see my applications?",
            "How do I upload my resume?",
            "Find senior roles posted this week"
        ];

        return {
            success: true,
            suggestions
        };
    });
}
