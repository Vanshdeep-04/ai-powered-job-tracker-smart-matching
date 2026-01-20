import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Get or create session ID
const getSessionId = () => {
    let sessionId = localStorage.getItem('jobtracker_session');
    if (!sessionId) {
        sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('jobtracker_session', sessionId);
    }
    return sessionId;
};

// Add session ID to all requests
api.interceptors.request.use((config) => {
    config.headers['x-session-id'] = getSessionId();
    return config;
});

// API methods
export const jobsAPI = {
    getJobs: (filters = {}) => {
        const params = new URLSearchParams();
        params.append('sessionId', getSessionId());

        if (filters.role) params.append('role', filters.role);
        if (filters.skills?.length) params.append('skills', filters.skills.join(','));
        if (filters.datePosted) params.append('datePosted', filters.datePosted);
        if (filters.jobType) params.append('jobType', filters.jobType);
        if (filters.workMode) params.append('workMode', filters.workMode);
        if (filters.location) params.append('location', filters.location);
        if (filters.matchScore) params.append('matchScore', filters.matchScore);
        if (filters.page) params.append('page', filters.page);

        return api.get(`/jobs?${params.toString()}`);
    },

    getJob: (jobId) => {
        return api.get(`/jobs/${jobId}?sessionId=${getSessionId()}`);
    }
};

export const resumeAPI = {
    upload: (file) => {
        const formData = new FormData();
        formData.append('file', file);

        return api.post('/resume', formData, {
            withCredentials: true
        });
    },

    getStatus: () => {
        return api.get('/resume', {
            withCredentials: true
        });
    },

    delete: () => {
        return api.delete('/resume', {
            withCredentials: true
        });
    }
};


export const applicationsAPI = {
    getAll: (filters = {}) => {
        const params = new URLSearchParams();
        if (filters.status) params.append('status', filters.status);
        if (filters.sortBy) params.append('sortBy', filters.sortBy);
        if (filters.order) params.append('order', filters.order);

        return api.get(`/applications?${params.toString()}`);
    },

    create: (application) => {
        return api.post('/applications', application);
    },

    updateStatus: (applicationId, status) => {
        return api.patch(`/applications/${applicationId}`, { status });
    },

    delete: (applicationId) => {
        return api.delete(`/applications/${applicationId}`);
    }
};

export const chatAPI = {
    send: (message) => {
        return api.post('/chat', { message });
    },

    getSuggestions: () => {
        return api.get('/chat/suggestions');
    }
};

export const resumeImprovementAPI = {
    getSuggestions: (job) => {
        return api.post('/resume-improvement/suggestions', {
            job,
            sessionId: localStorage.getItem('jobtracker_session')
        });
    }
};

export default api;
