// JSearch API integration (RapidAPI)
const JSEARCH_API_URL = 'https://jsearch.p.rapidapi.com';

class JobService {
    constructor() {
        this.apiKey = process.env.JSEARCH_API_KEY;
    }

    // Build query parameters for JSearch API
    buildQueryParams(filters) {
        const params = new URLSearchParams();

        // Query - combine role and skills
        let query = filters.role || 'developer';
        if (filters.skills && filters.skills.length > 0) {
            query += ' ' + filters.skills.join(' ');
        }
        params.append('query', query);

        // Location
        if (filters.location) {
            params.append('query', `${params.get('query')} in ${filters.location}`);
        }

        // Date posted filter
        if (filters.datePosted) {
            const dateMap = {
                'last24h': 'today',
                'lastWeek': 'week',
                'lastMonth': 'month',
                'anytime': 'all'
            };
            params.append('date_posted', dateMap[filters.datePosted] || 'all');
        }

        // Remote filter
        if (filters.workMode === 'remote') {
            params.append('remote_jobs_only', 'true');
        }

        // Employment type
        if (filters.jobType) {
            const typeMap = {
                'fulltime': 'FULLTIME',
                'parttime': 'PARTTIME',
                'contract': 'CONTRACTOR',
                'internship': 'INTERN'
            };
            params.append('employment_types', typeMap[filters.jobType] || 'FULLTIME');
        }

        // Pagination
        params.append('page', filters.page || '1');
        params.append('num_pages', '1');

        return params;
    }

    // Fetch jobs from JSearch API
    async fetchJobs(filters = {}) {
        if (!this.apiKey) {
            // Return mock data when API key not configured
            return this.getMockJobs(filters);
        }

        try {
            const params = this.buildQueryParams(filters);

            const response = await fetch(`${JSEARCH_API_URL}/search?${params.toString()}`, {
                method: 'GET',
                headers: {
                    'x-rapidapi-key': this.apiKey,
                    'x-rapidapi-host': 'jsearch.p.rapidapi.com'
                }
            });

            if (!response.ok) {
                throw new Error(`JSearch API error: ${response.status}`);
            }

            const data = await response.json();

            // Normalize the response
            return this.normalizeJobs(data.data || []);
        } catch (error) {
            console.error('Job fetch error:', error);
            return this.getMockJobs(filters);
        }
    }

    // Normalize JSearch API response to our format
    normalizeJobs(jobs) {
        return jobs.map(job => ({
            id: job.job_id,
            title: job.job_title,
            company: job.employer_name,
            companyLogo: job.employer_logo,
            location: job.job_city
                ? `${job.job_city}, ${job.job_state || ''} ${job.job_country || ''}`
                : job.job_country || 'Not specified',
            description: job.job_description,
            jobType: this.normalizeJobType(job.job_employment_type),
            workMode: job.job_is_remote ? 'remote' : 'onsite',
            salary: this.formatSalary(job.job_min_salary, job.job_max_salary, job.job_salary_currency),
            postedAt: job.job_posted_at_datetime_utc,
            applyLink: job.job_apply_link,
            skills: job.job_required_skills || [],
            experienceLevel: job.job_required_experience?.required_experience_in_months
                ? this.getExperienceLevel(job.job_required_experience.required_experience_in_months)
                : 'Not specified'
        }));
    }

    normalizeJobType(type) {
        const typeMap = {
            'FULLTIME': 'Full-time',
            'PARTTIME': 'Part-time',
            'CONTRACTOR': 'Contract',
            'INTERN': 'Internship'
        };
        return typeMap[type] || type || 'Full-time';
    }

    formatSalary(min, max, currency) {
        if (!min && !max) return null;
        const curr = currency || 'USD';
        if (min && max) {
            return `${curr} ${min.toLocaleString()} - ${max.toLocaleString()}`;
        }
        return `${curr} ${(min || max).toLocaleString()}`;
    }

    getExperienceLevel(months) {
        if (months < 12) return 'Entry Level';
        if (months < 36) return 'Junior';
        if (months < 60) return 'Mid-Level';
        if (months < 96) return 'Senior';
        return 'Lead/Principal';
    }

    // Mock jobs for demo/development
    getMockJobs(filters = {}) {
        const mockJobs = [
            {
                id: 'mock-1',
                title: 'Senior React Developer',
                company: 'TechCorp Inc.',
                companyLogo: null,
                location: 'San Francisco, CA',
                description: 'We are looking for an experienced React developer to join our team. You will be building modern web applications using React, TypeScript, and Node.js. Strong understanding of state management, hooks, and modern React patterns required.',
                jobType: 'Full-time',
                workMode: 'remote',
                salary: 'USD 120,000 - 180,000',
                postedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                applyLink: 'https://example.com/apply/1',
                skills: ['React', 'TypeScript', 'Node.js', 'GraphQL'],
                experienceLevel: 'Senior'
            },
            {
                id: 'mock-2',
                title: 'Full Stack Engineer',
                company: 'StartupXYZ',
                companyLogo: null,
                location: 'New York, NY',
                description: 'Join our fast-growing startup as a Full Stack Engineer. Work with Python, Django, React, and PostgreSQL. We value creativity, ownership, and a passion for building great products.',
                jobType: 'Full-time',
                workMode: 'hybrid',
                salary: 'USD 100,000 - 150,000',
                postedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                applyLink: 'https://example.com/apply/2',
                skills: ['Python', 'Django', 'React', 'PostgreSQL'],
                experienceLevel: 'Mid-Level'
            },
            {
                id: 'mock-3',
                title: 'Frontend Developer',
                company: 'DesignStudio',
                companyLogo: null,
                location: 'Austin, TX',
                description: 'Looking for a creative Frontend Developer with strong CSS skills. Experience with Vue.js or React required. You will work closely with designers to create beautiful, responsive interfaces.',
                jobType: 'Full-time',
                workMode: 'onsite',
                salary: 'USD 80,000 - 110,000',
                postedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                applyLink: 'https://example.com/apply/3',
                skills: ['JavaScript', 'CSS', 'Vue.js', 'React', 'Figma'],
                experienceLevel: 'Junior'
            },
            {
                id: 'mock-4',
                title: 'Backend Engineer - Node.js',
                company: 'CloudServices Ltd',
                companyLogo: null,
                location: 'Seattle, WA',
                description: 'Build scalable backend services using Node.js and AWS. Experience with microservices, Docker, and Kubernetes is a plus. Join our team working on cutting-edge cloud infrastructure.',
                jobType: 'Full-time',
                workMode: 'remote',
                salary: 'USD 130,000 - 170,000',
                postedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                applyLink: 'https://example.com/apply/4',
                skills: ['Node.js', 'AWS', 'Docker', 'Kubernetes', 'MongoDB'],
                experienceLevel: 'Senior'
            },
            {
                id: 'mock-5',
                title: 'Junior Software Developer',
                company: 'LearnTech',
                companyLogo: null,
                location: 'Denver, CO',
                description: 'Great opportunity for recent graduates! Learn and grow with our mentorship program. Work on EdTech products using React and Python. We provide training and support for career development.',
                jobType: 'Full-time',
                workMode: 'hybrid',
                salary: 'USD 60,000 - 80,000',
                postedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
                applyLink: 'https://example.com/apply/5',
                skills: ['JavaScript', 'Python', 'React', 'SQL'],
                experienceLevel: 'Entry Level'
            },
            {
                id: 'mock-6',
                title: 'DevOps Engineer',
                company: 'InfraPlus',
                companyLogo: null,
                location: 'Chicago, IL',
                description: 'Looking for a DevOps engineer to manage our CI/CD pipelines and cloud infrastructure. Strong Linux, AWS, and Terraform experience required.',
                jobType: 'Full-time',
                workMode: 'remote',
                salary: 'USD 110,000 - 150,000',
                postedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
                applyLink: 'https://example.com/apply/6',
                skills: ['AWS', 'Terraform', 'Docker', 'Linux', 'CI/CD'],
                experienceLevel: 'Mid-Level'
            },
            {
                id: 'mock-7',
                title: 'UX Designer',
                company: 'ProductVision',
                companyLogo: null,
                location: 'Los Angeles, CA',
                description: 'Join our design team to create intuitive user experiences. Proficiency in Figma, user research, and prototyping required. Work on consumer-facing products used by millions.',
                jobType: 'Full-time',
                workMode: 'hybrid',
                salary: 'USD 90,000 - 130,000',
                postedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                applyLink: 'https://example.com/apply/7',
                skills: ['Figma', 'UX Research', 'Prototyping', 'UI Design'],
                experienceLevel: 'Mid-Level'
            },
            {
                id: 'mock-8',
                title: 'Data Scientist',
                company: 'AnalyticsPro',
                companyLogo: null,
                location: 'Boston, MA',
                description: 'Apply machine learning to solve business problems. Experience with Python, pandas, scikit-learn, and TensorFlow. PhD preferred but not required.',
                jobType: 'Full-time',
                workMode: 'remote',
                salary: 'USD 140,000 - 190,000',
                postedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                applyLink: 'https://example.com/apply/8',
                skills: ['Python', 'Machine Learning', 'TensorFlow', 'SQL', 'Statistics'],
                experienceLevel: 'Senior'
            },
            {
                id: 'mock-9',
                title: 'Mobile Developer - React Native',
                company: 'AppFactory',
                companyLogo: null,
                location: 'Miami, FL',
                description: 'Build cross-platform mobile apps using React Native. Experience with iOS and Android deployment, push notifications, and mobile UX patterns.',
                jobType: 'Full-time',
                workMode: 'onsite',
                salary: 'USD 95,000 - 135,000',
                postedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                applyLink: 'https://example.com/apply/9',
                skills: ['React Native', 'JavaScript', 'iOS', 'Android'],
                experienceLevel: 'Mid-Level'
            },
            {
                id: 'mock-10',
                title: 'Software Engineering Intern',
                company: 'BigTech Corp',
                companyLogo: null,
                location: 'San Jose, CA',
                description: 'Summer internship opportunity for CS students. Work on real projects with senior engineers. Learn industry best practices and modern development workflows.',
                jobType: 'Internship',
                workMode: 'hybrid',
                salary: 'USD 6,000/month',
                postedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
                applyLink: 'https://example.com/apply/10',
                skills: ['Java', 'Python', 'Data Structures', 'Algorithms'],
                experienceLevel: 'Entry Level'
            }
        ];

        // Apply filters to mock data
        let filtered = [...mockJobs];

        if (filters.role) {
            const role = filters.role.toLowerCase();
            filtered = filtered.filter(job =>
                job.title.toLowerCase().includes(role) ||
                job.description.toLowerCase().includes(role)
            );
        }

        if (filters.skills && filters.skills.length > 0) {
            filtered = filtered.filter(job =>
                filters.skills.some(skill =>
                    job.skills.some(jobSkill =>
                        jobSkill.toLowerCase() === skill.toLowerCase()
                    )
                )
            );
        }

        if (filters.workMode && filters.workMode !== 'all') {
            filtered = filtered.filter(job => job.workMode === filters.workMode);
        }

        if (filters.jobType && filters.jobType !== 'all') {
            const typeMap = {
                'fulltime': 'Full-time',
                'parttime': 'Part-time',
                'contract': 'Contract',
                'internship': 'Internship'
            };
            filtered = filtered.filter(job => job.jobType === typeMap[filters.jobType]);
        }

        if (filters.datePosted && filters.datePosted !== 'anytime') {
            const now = Date.now();
            const thresholds = {
                'last24h': 24 * 60 * 60 * 1000,
                'lastWeek': 7 * 24 * 60 * 60 * 1000,
                'lastMonth': 30 * 24 * 60 * 60 * 1000
            };
            const threshold = thresholds[filters.datePosted];
            if (threshold) {
                filtered = filtered.filter(job =>
                    now - new Date(job.postedAt).getTime() <= threshold
                );
            }
        }

        // Location filter - check if search term is in job location
        if (filters.location && filters.location.trim()) {
            const location = filters.location.toLowerCase().trim();
            filtered = filtered.filter(job =>
                job.location.toLowerCase().includes(location)
            );
        }

        return filtered;
    }
}

export default new JobService();
