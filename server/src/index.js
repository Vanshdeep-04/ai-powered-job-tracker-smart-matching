import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import dotenv from 'dotenv';

// Import routes
import jobsRoutes from './routes/jobs.js';
import resumeRoutes from './routes/resume.js';
import applicationsRoutes from './routes/applications.js';
import chatRoutes from './routes/chat.js';
import resumeImprovementRoutes from './routes/resumeImprovement.js';

dotenv.config();

const fastify = Fastify({
    logger: true
});

// Register plugins
await fastify.register(cors, {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-session-id'
  ]
});





await fastify.register(multipart, {
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB max file size
    }
});

// Health check route
fastify.get('/api/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
});

// Register API routes
await fastify.register(jobsRoutes, { prefix: '/api/jobs' });
await fastify.register(resumeRoutes, { prefix: '/api/resume' });
await fastify.register(applicationsRoutes, { prefix: '/api/applications' });
await fastify.register(chatRoutes, { prefix: '/api/chat' });
await fastify.register(resumeImprovementRoutes, { prefix: '/api/resume-improvement' });

// Start server
const start = async () => {
    try {
        const port = process.env.PORT || 3001;
        await fastify.listen({ port, host: '0.0.0.0' });
        console.log(`🚀 Server running on http://localhost:${port}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
