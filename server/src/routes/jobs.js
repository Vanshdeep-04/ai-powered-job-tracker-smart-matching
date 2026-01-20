import jobService from '../services/jobService.js';
import aiService from '../services/aiService.js';
import storageService from '../services/storageService.js';

export default async function jobsRoutes(fastify) {
    // Get jobs with optional filters and AI scoring
    fastify.get('/', async (request, reply) => {
        const {
            role,
            skills,
            datePosted,
            jobType,
            workMode,
            location,
            matchScore,
            page = 1,
            sessionId
        } = request.query;

        try {
            // Parse skills if provided as comma-separated string
            const skillsArray = skills ? skills.split(',').map(s => s.trim()) : [];

            // Fetch jobs with filters
            const filters = {
                role,
                skills: skillsArray,
                datePosted,
                jobType,
                workMode,
                location,
                page: parseInt(page)
            };

            let jobs = await jobService.fetchJobs(filters);

            // Always add match scores
            const resume = sessionId ? await storageService.getResume(sessionId) : null;

            if (resume && resume.text) {
                // Score jobs against resume with AI
                jobs = await aiService.scoreJobs(jobs, resume.text);
            } else if (skillsArray.length > 0) {
                // Calculate match based on selected skills
                jobs = jobs.map(job => {
                    const jobSkillsLower = job.skills.map(s => s.toLowerCase());
                    const selectedSkillsLower = skillsArray.map(s => s.toLowerCase());

                    // Count how many selected skills match the job
                    const matchedSkills = selectedSkillsLower.filter(skill =>
                        jobSkillsLower.includes(skill)
                    );

                    // Calculate score: percentage of job skills that match selected skills
                    const matchPercentage = job.skills.length > 0
                        ? Math.round((matchedSkills.length / job.skills.length) * 100)
                        : 0;

                    // Also factor in coverage: what % of selected skills does the job need
                    const coveragePercentage = selectedSkillsLower.length > 0
                        ? Math.round((matchedSkills.length / selectedSkillsLower.length) * 100)
                        : 0;

                    // Combined score: average of both metrics
                    const score = Math.round((matchPercentage + coveragePercentage) / 2);

                    return {
                        ...job,
                        matchScore: score,
                        matchData: {
                            score,
                            matchedSkills: matchedSkills.map(s =>
                                job.skills.find(js => js.toLowerCase() === s) || s
                            ),
                            missingSkills: selectedSkillsLower
                                .filter(s => !jobSkillsLower.includes(s))
                                .map(s => skillsArray.find(sk => sk.toLowerCase() === s) || s),
                            experienceMatch: score > 70 ? 'strong' : score > 40 ? 'moderate' : 'weak',
                            explanation: matchedSkills.length > 0
                                ? `This job matches ${matchedSkills.length} of your ${skillsArray.length} selected skill(s).`
                                : `This job doesn't require your selected skills.`
                        }
                    };
                });
            } else {
                // No resume or skills selected - use predefined mock scores
                jobs = jobs.map(job => {
                    const mockScore = aiService.getMockScore(job);
                    return {
                        ...job,
                        matchScore: mockScore.score,
                        matchData: mockScore
                    };
                });
            }

            // Sort by match score (highest first)
            jobs.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

            // Filter by match score if requested
            if (matchScore === 'high') {
                jobs = jobs.filter(job => job.matchScore >= 70);
            } else if (matchScore === 'medium') {
                jobs = jobs.filter(job => job.matchScore >= 40 && job.matchScore < 70);
            }

            // Get best matches (top 8 with score > 60)
            const bestMatches = jobs
                .filter(job => job.matchScore && job.matchScore >= 60)
                .slice(0, 8);

            return {
                success: true,
                jobs,
                bestMatches,
                total: jobs.length,
                page: parseInt(page),
                hasResume: !!(resume && resume.text)
            };
        } catch (error) {
            console.error('Jobs fetch error:', error);
            reply.status(500).send({
                success: false,
                error: 'Failed to fetch jobs'
            });
        }
    });

    // Get single job details
    fastify.get('/:jobId', async (request, reply) => {
        const { jobId } = request.params;
        const { sessionId } = request.query;

        try {
            const jobs = await jobService.fetchJobs({});
            const job = jobs.find(j => j.id === jobId);

            if (!job) {
                return reply.status(404).send({
                    success: false,
                    error: 'Job not found'
                });
            }

            // Score if resume available
            if (sessionId) {
                const resume = await storageService.getResume(sessionId);
                if (resume && resume.text) {
                    const scoreData = await aiService.scoreJobMatch(job, resume.text);
                    job.matchScore = scoreData.score;
                    job.matchData = scoreData;
                }
            }

            return {
                success: true,
                job
            };
        } catch (error) {
            console.error('Job fetch error:', error);
            reply.status(500).send({
                success: false,
                error: 'Failed to fetch job'
            });
        }
    });
}
