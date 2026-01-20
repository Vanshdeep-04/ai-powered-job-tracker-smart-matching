import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = process.env.GEMINI_API_KEY
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null;

class AIService {
    constructor() {
        this.model = genAI ? genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }) : null;
    }

    // Create a hash of resume text for caching
    createResumeHash(resumeText) {
        let hash = 0;
        for (let i = 0; i < Math.min(resumeText.length, 1000); i++) {
            const char = resumeText.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    }

    // Score a single job against resume
    async scoreJobMatch(job, resumeText) {
        if (this.model) {
            // Use Gemini AI for scoring
            try {
                const prompt = `You are a job matching AI. Analyze how well this job matches the candidate's resume.

JOB DETAILS:
Title: ${job.title}
Company: ${job.company}
Location: ${job.location}
Description: ${job.description || 'Not provided'}
Required Skills: ${job.skills?.join(', ') || 'Not specified'}
Job Type: ${job.jobType || 'Not specified'}

CANDIDATE RESUME:
${resumeText.substring(0, 3000)}

Respond with ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "score": <number 0-100>,
  "matchedSkills": ["skill1", "skill2"],
  "missingSkills": ["skill1", "skill2"],
  "experienceMatch": "strong|moderate|weak",
  "explanation": "1-2 sentence explanation of why this is or isn't a good match"
}`;

                const result = await this.model.generateContent(prompt);
                const response = await result.response;
                const text = response.text();

                // Clean up response - remove any markdown formatting
                const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();

                try {
                    return JSON.parse(cleanedText);
                } catch (parseError) {
                    console.error('Failed to parse AI response:', cleanedText);
                }
            } catch (error) {
                console.error('AI scoring error:', error);
            }
        }

        // Fallback: Keyword-based matching when AI is not available
        return this.scoreWithKeywords(job, resumeText);
    }

    // Keyword-based scoring when AI is not configured
    scoreWithKeywords(job, resumeText) {
        const resumeLower = resumeText.toLowerCase();

        // Common tech skills to look for
        const techSkills = [
            'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'rust', 'ruby', 'php', 'swift', 'kotlin',
            'react', 'angular', 'vue', 'next.js', 'node.js', 'express', 'django', 'flask', 'spring', 'rails',
            'html', 'css', 'sass', 'tailwind', 'bootstrap',
            'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch',
            'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'jenkins', 'ci/cd',
            'git', 'github', 'gitlab', 'jira', 'agile', 'scrum',
            'rest', 'graphql', 'api', 'microservices',
            'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'data science',
            'figma', 'sketch', 'ui', 'ux', 'design',
            'full stack', 'frontend', 'backend', 'devops', 'mobile', 'ios', 'android'
        ];

        // Extract skills from resume
        const resumeSkills = techSkills.filter(skill =>
            resumeLower.includes(skill.toLowerCase())
        );

        // Get job required skills (lowercase)
        const jobSkillsLower = job.skills.map(s => s.toLowerCase());
        const jobTitleLower = job.title.toLowerCase();
        const jobDescLower = (job.description || '').toLowerCase();

        // Find matching skills
        const matchedSkills = resumeSkills.filter(skill =>
            jobSkillsLower.some(js => js.includes(skill) || skill.includes(js)) ||
            jobTitleLower.includes(skill) ||
            jobDescLower.includes(skill)
        );

        // Check for title/role matches
        const roleKeywords = ['developer', 'engineer', 'designer', 'analyst', 'manager', 'lead', 'senior', 'junior', 'intern'];
        const resumeRoles = roleKeywords.filter(role => resumeLower.includes(role));
        const jobRoles = roleKeywords.filter(role => jobTitleLower.includes(role));
        const roleMatch = resumeRoles.some(role => jobRoles.includes(role));

        // Check for experience level match
        const expKeywords = ['senior', 'lead', 'principal', 'staff', 'junior', 'entry', 'intern', 'mid'];
        const resumeExp = expKeywords.find(exp => resumeLower.includes(exp));
        const jobExp = expKeywords.find(exp => jobTitleLower.includes(exp));
        const expMatch = resumeExp === jobExp || (!resumeExp && !jobExp);

        // Calculate score
        let score = 0;

        // Skill matching (up to 60 points)
        if (job.skills.length > 0) {
            score += Math.round((matchedSkills.length / Math.max(job.skills.length, 3)) * 60);
        } else if (matchedSkills.length > 0) {
            score += Math.min(matchedSkills.length * 15, 60);
        }

        // Role match (up to 25 points)
        if (roleMatch) score += 25;

        // Experience match (up to 15 points)
        if (expMatch) score += 15;

        // Cap at 100
        score = Math.min(score, 100);

        // Find missing skills
        const missingSkills = job.skills
            .filter(skill => !matchedSkills.some(ms =>
                ms.toLowerCase().includes(skill.toLowerCase()) ||
                skill.toLowerCase().includes(ms.toLowerCase())
            ))
            .slice(0, 3);

        return {
            score,
            matchedSkills: matchedSkills.slice(0, 5),
            missingSkills,
            experienceMatch: score > 70 ? 'strong' : score > 40 ? 'moderate' : 'weak',
            explanation: this.generateExplanation(score, matchedSkills, roleMatch, job)
        };
    }

    generateExplanation(score, matchedSkills, roleMatch, job) {
        if (score >= 70) {
            return `Strong match! Your skills in ${matchedSkills.slice(0, 3).join(', ')} align well with this ${job.title} role.`;
        } else if (score >= 40) {
            return `Moderate match. You have ${matchedSkills.length} relevant skill(s), but may need to develop additional expertise.`;
        } else {
            return `Limited match. This ${job.title} role requires skills not prominently featured in your resume.`;
        }
    }

    // Score multiple jobs in parallel with concurrency limit
    async scoreJobs(jobs, resumeText, concurrencyLimit = 5) {
        const results = [];
        const resumeHash = this.createResumeHash(resumeText);

        for (let i = 0; i < jobs.length; i += concurrencyLimit) {
            const batch = jobs.slice(i, i + concurrencyLimit);
            const batchResults = await Promise.all(
                batch.map(async (job) => {
                    const scoreData = await this.scoreJobMatch(job, resumeText);
                    return {
                        ...job,
                        matchScore: scoreData.score,
                        matchData: scoreData
                    };
                })
            );
            results.push(...batchResults);
        }

        return results;
    }

    // Process chat messages
    async processChat(message, context) {
        if (!this.model) {
            return this.getMockChatResponse(message);
        }

        try {
            const { resumeText, applications, availableFilters } = context;

            const systemPrompt = `You are a helpful AI assistant for a job tracking application. You help users:
1. Find and filter jobs based on their preferences
2. Understand how the application works
3. Get insights about their job search

AVAILABLE FILTERS:
- Role/Title: Free text search
- Skills: ${availableFilters?.skills?.join(', ') || 'React, Node.js, Python, JavaScript, TypeScript, etc.'}
- Date Posted: last24h, lastWeek, lastMonth, anytime
- Job Type: fulltime, parttime, contract, internship
- Work Mode: remote, hybrid, onsite
- Location: Free text (city/region)
- Match Score: high (>70%), medium (40-70%), all

USER'S RESUME SUMMARY: ${resumeText ? 'User has uploaded a resume' : 'No resume uploaded yet'}
USER'S APPLICATIONS: ${applications?.length || 0} jobs applied

When users ask about jobs, respond with:
1. Natural language explanation
2. If they want to filter jobs, include a JSON block with filters like:
{"action": "filter", "filters": {"role": "...", "skills": [...], "workMode": "..."}}

For product questions, give clear explanations about how to use the app.`;

            const prompt = `${systemPrompt}\n\nUser: ${message}`;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Try to extract filter action from response
            const filterMatch = text.match(/\{"action":\s*"filter".*?\}/s);

            return {
                message: text.replace(/\{"action":\s*"filter".*?\}/s, '').trim(),
                action: filterMatch ? JSON.parse(filterMatch[0]) : null
            };
        } catch (error) {
            console.error('Chat AI error:', error);
            return this.getMockChatResponse(message);
        }
    }

    // Mock score for demo/development - deterministic based on job ID
    getMockScore(job) {
        // Generate consistent score based on job ID hash
        let hash = 0;
        const jobId = job.id || job.title;
        for (let i = 0; i < jobId.length; i++) {
            const char = jobId.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }

        // Map hash to a score between 25-95
        const baseScore = Math.abs(hash % 71) + 25;

        // Assign predefined scores to some mock jobs for variety
        const predefinedScores = {
            'mock-1': 85,  // Senior React Developer - High
            'mock-2': 72,  // Full Stack Engineer - High
            'mock-3': 55,  // Frontend Developer - Medium
            'mock-4': 78,  // Backend Engineer - High
            'mock-5': 42,  // Junior Software Developer - Medium
            'mock-6': 65,  // DevOps Engineer - Medium
            'mock-7': 35,  // UX Designer - Low
            'mock-8': 88,  // Data Scientist - High
            'mock-9': 60,  // Mobile Developer - Medium
            'mock-10': 30  // Software Engineering Intern - Low
        };

        const score = predefinedScores[job.id] || baseScore;

        const skills = ['JavaScript', 'React', 'Node.js', 'Python', 'TypeScript'];
        const numMatched = Math.floor(score / 25) + 1;
        const matchedSkills = skills.slice(0, Math.min(numMatched, 4));
        const missingSkills = skills.slice(numMatched, numMatched + 2);

        return {
            score,
            matchedSkills,
            missingSkills,
            experienceMatch: score > 70 ? 'strong' : score > 40 ? 'moderate' : 'weak',
            explanation: `This position at ${job.company} has ${score > 60 ? 'good' : 'some'} alignment with your background.`
        };
    }

    // Mock chat response
    getMockChatResponse(message) {
        const lowerMessage = message.toLowerCase();

        if (lowerMessage.includes('remote') || lowerMessage.includes('filter')) {
            return {
                message: "I can help you find remote jobs! I've applied a filter to show remote positions. You can also use the filters panel on the left to refine your search further.",
                action: { action: 'filter', filters: { workMode: 'remote' } }
            };
        }

        if (lowerMessage.includes('resume')) {
            return {
                message: "To upload your resume, click on the 'Upload Resume' button in the navigation bar. We support PDF and TXT files. Once uploaded, I'll automatically score how well each job matches your profile!",
                action: null
            };
        }

        if (lowerMessage.includes('application') || lowerMessage.includes('applied')) {
            return {
                message: "You can see all your applications in the Dashboard page. Click 'Dashboard' in the navigation to view your application timeline, filter by status, and track your progress.",
                action: null
            };
        }

        if (lowerMessage.includes('match') || lowerMessage.includes('score')) {
            return {
                message: "The matching system analyzes your resume against each job listing. A score above 70% (green badge) means strong alignment, 40-70% (yellow) is moderate, and below 40% (gray) indicates fewer matches. The best matching jobs appear at the top in the 'Best Matches' section!",
                action: null
            };
        }

        return {
            message: "I'm here to help! You can ask me to:\n• Find specific types of jobs (e.g., 'Show me remote React jobs')\n• Explain how features work\n• Get insights about your applications\n\nWhat would you like to know?",
            action: null
        };
    }

    // Generate resume improvement suggestions for a specific job
    async getResumeImprovements(job, resumeText) {
        if (this.model) {
            try {
                const prompt = `You are a professional resume coach. Analyze this resume against the job requirements and provide specific improvement suggestions.

JOB DETAILS:
Title: ${job.title}
Company: ${job.company}
Description: ${job.description || 'Not provided'}
Required Skills: ${job.skills?.join(', ') || 'Not specified'}

CANDIDATE RESUME:
${resumeText.substring(0, 4000)}

Provide actionable resume improvement suggestions. Respond with ONLY valid JSON (no markdown):
{
  "missingKeywords": [
    {"keyword": "keyword1", "importance": "high|medium", "suggestion": "Where/how to add this keyword"},
    {"keyword": "keyword2", "importance": "high|medium", "suggestion": "Where/how to add this keyword"}
  ],
  "bulletPointImprovements": [
    {"original": "Original weak bullet or area", "improved": "Stronger, quantified version", "reason": "Why this is better"},
    {"original": "Another area", "improved": "Better version", "reason": "Explanation"}
  ],
  "skillGaps": [
    {"skill": "Skill name", "priority": "high|medium|low", "howToAddress": "Suggestion to address this gap"}
  ],
  "overallScore": 0-100,
  "summary": "2-3 sentence summary of the main areas to improve"
}`;

                const result = await this.model.generateContent(prompt);
                const response = await result.response;
                const text = response.text();
                const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();

                try {
                    return JSON.parse(cleanedText);
                } catch (parseError) {
                    console.error('Failed to parse AI response:', cleanedText);
                }
            } catch (error) {
                console.error('Resume improvement AI error:', error);
            }
        }

        // Fallback: Keyword-based suggestions
        return this.getMockResumeImprovements(job, resumeText);
    }

    // Mock resume improvements when AI is not available
    getMockResumeImprovements(job, resumeText) {
        const resumeLower = resumeText.toLowerCase();
        const jobSkills = job.skills || [];

        // Find missing keywords
        const missingKeywords = jobSkills
            .filter(skill => !resumeLower.includes(skill.toLowerCase()))
            .slice(0, 5)
            .map((skill, index) => ({
                keyword: skill,
                importance: index < 2 ? 'high' : 'medium',
                suggestion: `Add "${skill}" to your skills section or incorporate it into your experience descriptions`
            }));

        // Generate bullet point improvements
        const bulletPointImprovements = [
            {
                original: "Worked on web development projects",
                improved: `Developed and deployed ${job.skills?.[0] || 'full-stack'} applications serving 10,000+ users`,
                reason: "Quantify impact and specify technologies used"
            },
            {
                original: "Collaborated with team members",
                improved: "Led cross-functional collaboration between 5 engineers and 2 designers, reducing delivery time by 30%",
                reason: "Show leadership and measurable outcomes"
            },
            {
                original: "Fixed bugs and issues",
                improved: "Identified and resolved 50+ critical bugs, improving application stability by 40%",
                reason: "Quantify your contributions with specific numbers"
            }
        ];

        // Identify skill gaps
        const skillGaps = missingKeywords.slice(0, 3).map((kw, index) => ({
            skill: kw.keyword,
            priority: index === 0 ? 'high' : 'medium',
            howToAddress: `Consider taking a course or building a project with ${kw.keyword} to strengthen this skill`
        }));

        // Calculate overall score based on keyword matches
        const matchedCount = jobSkills.filter(skill =>
            resumeLower.includes(skill.toLowerCase())
        ).length;
        const overallScore = jobSkills.length > 0
            ? Math.round((matchedCount / jobSkills.length) * 100)
            : 50;

        return {
            missingKeywords,
            bulletPointImprovements,
            skillGaps,
            overallScore,
            summary: `Your resume matches ${matchedCount} of ${jobSkills.length} required skills for this ${job.title} position. Focus on adding missing keywords and quantifying your achievements to improve your chances.`
        };
    }
}

export default new AIService();
