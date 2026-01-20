import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = process.env.UPSTASH_REDIS_REST_URL
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN
    })
    : null;

// In-memory fallback when Redis is not configured
const inMemoryStore = {
    resumes: new Map(),
    applications: new Map(),
    jobsCache: new Map()
};

class StorageService {
    // Session-based key generation
    getKey(sessionId, type) {
        return `user:${sessionId}:${type}`;
    }

    // Resume operations
    async saveResume(sessionId, resumeData) {
        const key = this.getKey(sessionId, 'resume');
        const data = {
            text: resumeData.text,
            filename: resumeData.filename,
            uploadedAt: new Date().toISOString()
        };

        if (redis) {
            await redis.set(key, JSON.stringify(data));
        } else {
            inMemoryStore.resumes.set(sessionId, data);
        }
        return data;
    }

    async getResume(sessionId) {
        const key = this.getKey(sessionId, 'resume');

        if (redis) {
            const data = await redis.get(key);
            return data ? (typeof data === 'string' ? JSON.parse(data) : data) : null;
        }
        return inMemoryStore.resumes.get(sessionId) || null;
    }

    async deleteResume(sessionId) {
        const key = this.getKey(sessionId, 'resume');

        if (redis) {
            await redis.del(key);
        } else {
            inMemoryStore.resumes.delete(sessionId);
        }
        return true;
    }

    // Application operations
    async getApplications(sessionId) {
        const key = this.getKey(sessionId, 'applications');

        if (redis) {
            const data = await redis.get(key);
            return data ? (typeof data === 'string' ? JSON.parse(data) : data) : [];
        }
        return inMemoryStore.applications.get(sessionId) || [];
    }

    async saveApplication(sessionId, application) {
        const applications = await this.getApplications(sessionId);

        // Check if application already exists
        const existingIndex = applications.findIndex(
            app => app.jobId === application.jobId
        );

        if (existingIndex >= 0) {
            applications[existingIndex] = {
                ...applications[existingIndex],
                ...application,
                updatedAt: new Date().toISOString()
            };
        } else {
            applications.push({
                ...application,
                id: Date.now().toString(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        }

        const key = this.getKey(sessionId, 'applications');

        if (redis) {
            await redis.set(key, JSON.stringify(applications));
        } else {
            inMemoryStore.applications.set(sessionId, applications);
        }

        return applications[existingIndex >= 0 ? existingIndex : applications.length - 1];
    }

    async updateApplicationStatus(sessionId, applicationId, status) {
        const applications = await this.getApplications(sessionId);
        const index = applications.findIndex(app => app.id === applicationId);

        if (index === -1) {
            throw new Error('Application not found');
        }

        applications[index] = {
            ...applications[index],
            status,
            statusHistory: [
                ...(applications[index].statusHistory || []),
                { status, timestamp: new Date().toISOString() }
            ],
            updatedAt: new Date().toISOString()
        };

        const key = this.getKey(sessionId, 'applications');

        if (redis) {
            await redis.set(key, JSON.stringify(applications));
        } else {
            inMemoryStore.applications.set(sessionId, applications);
        }

        return applications[index];
    }

    // Job cache operations
    async getCachedJobs(cacheKey) {
        if (redis) {
            const data = await redis.get(`jobs:cache:${cacheKey}`);
            return data ? (typeof data === 'string' ? JSON.parse(data) : data) : null;
        }
        return inMemoryStore.jobsCache.get(cacheKey) || null;
    }

    async setCachedJobs(cacheKey, jobs, ttl = 300) {
        if (redis) {
            await redis.set(`jobs:cache:${cacheKey}`, JSON.stringify(jobs), { ex: ttl });
        } else {
            inMemoryStore.jobsCache.set(cacheKey, jobs);
            // Simple TTL for in-memory
            setTimeout(() => inMemoryStore.jobsCache.delete(cacheKey), ttl * 1000);
        }
    }

    // Match score cache
    async getCachedScore(jobId, resumeHash) {
        const key = `scores:${jobId}:${resumeHash}`;
        if (redis) {
            const data = await redis.get(key);
            return data ? (typeof data === 'string' ? JSON.parse(data) : data) : null;
        }
        return null;
    }

    async setCachedScore(jobId, resumeHash, scoreData, ttl = 3600) {
        const key = `scores:${jobId}:${resumeHash}`;
        if (redis) {
            await redis.set(key, JSON.stringify(scoreData), { ex: ttl });
        }
    }
}

export default new StorageService();
