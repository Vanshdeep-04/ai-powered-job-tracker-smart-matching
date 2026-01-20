import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { resumeAPI, applicationsAPI } from '../services/api';

const AppContext = createContext(null);

export function AppProvider({ children }) {
    // Resume state
    const [resume, setResume] = useState(null);
    const [resumeLoading, setResumeLoading] = useState(true);

    // Applications state
    const [applications, setApplications] = useState([]);
    const [applicationsStats, setApplicationsStats] = useState({
        total: 0,
        applied: 0,
        interview: 0,
        offer: 0,
        rejected: 0
    });

    // Saved jobs state
    const [savedJobs, setSavedJobs] = useState(() => {
        const saved = localStorage.getItem('savedJobs');
        return saved ? JSON.parse(saved) : [];
    });

    // Pending application (for popup flow)
    const [pendingApplication, setPendingApplication] = useState(null);

    // Toast notifications
    const [toasts, setToasts] = useState([]);

    // Show resume upload modal
    const [showResumeModal, setShowResumeModal] = useState(false);

    // Load initial data
    useEffect(() => {
        loadResume();
        loadApplications();

        // Check for pending application in localStorage
        const pending = localStorage.getItem('pendingApplication');
        if (pending) {
            setPendingApplication(JSON.parse(pending));
        }
    }, []);

    // Persist saved jobs to localStorage
    useEffect(() => {
        localStorage.setItem('savedJobs', JSON.stringify(savedJobs));
    }, [savedJobs]);

    // Load resume status
    const loadResume = useCallback(async () => {
        try {
            setResumeLoading(true);
            const response = await resumeAPI.getStatus();
            if (response.data.hasResume) {
                setResume(response.data.resume);
            } else {
                setResume(null);
            }
        } catch (error) {
            console.error('Failed to load resume:', error);
        } finally {
            setResumeLoading(false);
        }
    }, []);

    // Upload resume
    const uploadResume = useCallback(async (file) => {
        try {
            const response = await resumeAPI.upload(file);
            if (response.data.success) {
                setResume(response.data.resume);
                addToast('Resume uploaded successfully!', 'success');
                return true;
            }
        } catch (error) {
            console.error('Failed to upload resume:', error);
            addToast(error.response?.data?.error || 'Failed to upload resume', 'error');
            return false;
        }
    }, []);

    // Delete resume
    const deleteResume = useCallback(async () => {
        try {
            await resumeAPI.delete();
            setResume(null);
            addToast('Resume deleted', 'success');
            return true;
        } catch (error) {
            console.error('Failed to delete resume:', error);
            addToast('Failed to delete resume', 'error');
            return false;
        }
    }, []);

    // Load applications
    const loadApplications = useCallback(async () => {
        try {
            const response = await applicationsAPI.getAll();
            if (response.data.success) {
                setApplications(response.data.applications);
                setApplicationsStats(response.data.stats);
            }
        } catch (error) {
            console.error('Failed to load applications:', error);
        }
    }, []);

    // Track application
    const trackApplication = useCallback(async (job, status = 'applied') => {
        try {
            const response = await applicationsAPI.create({
                jobId: job.id,
                jobTitle: job.title,
                company: job.company,
                applyLink: job.applyLink,
                matchScore: job.matchScore
            });

            if (response.data.success) {
                await loadApplications();
                addToast(`Application to ${job.company} tracked!`, 'success');
                return true;
            }
        } catch (error) {
            console.error('Failed to track application:', error);
            addToast('Failed to track application', 'error');
            return false;
        }
    }, [loadApplications]);

    // Update application status
    const updateApplicationStatus = useCallback(async (applicationId, status) => {
        try {
            const response = await applicationsAPI.updateStatus(applicationId, status);
            if (response.data.success) {
                await loadApplications();
                addToast('Status updated', 'success');
                return true;
            }
        } catch (error) {
            console.error('Failed to update status:', error);
            addToast('Failed to update status', 'error');
            return false;
        }
    }, [loadApplications]);

    // Save/unsave job
    const toggleSaveJob = useCallback((job) => {
        const isAlreadySaved = savedJobs.some(saved => saved.id === job.id);

        if (isAlreadySaved) {
            setSavedJobs(prev => prev.filter(saved => saved.id !== job.id));
            addToast('Job removed from saved', 'success');
        } else {
            setSavedJobs(prev => [...prev, { ...job, savedAt: new Date().toISOString() }]);
            addToast('Job saved!', 'success');
        }
    }, [savedJobs]);

    // Check if job is saved
    const isJobSaved = useCallback((jobId) => {
        return savedJobs.some(saved => saved.id === jobId);
    }, [savedJobs]);

    // Handle "Apply" click - store pending and open link
    const handleApply = useCallback((job) => {
        const pending = {
            job,
            timestamp: Date.now()
        };
        localStorage.setItem('pendingApplication', JSON.stringify(pending));
        setPendingApplication(pending);

        // Open job link in new tab
        window.open(job.applyLink, '_blank');
    }, []);

    // Clear pending application
    const clearPendingApplication = useCallback(() => {
        localStorage.removeItem('pendingApplication');
        setPendingApplication(null);
    }, []);

    // Toast management
    const addToast = useCallback((message, type = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);

        // Auto remove after 4 seconds
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const value = {
        // Resume
        resume,
        resumeLoading,
        loadResume,
        uploadResume,
        deleteResume,
        showResumeModal,
        setShowResumeModal,

        // Applications
        applications,
        applicationsStats,
        loadApplications,
        trackApplication,
        updateApplicationStatus,

        // Saved Jobs
        savedJobs,
        toggleSaveJob,
        isJobSaved,

        // Pending application (popup flow)
        pendingApplication,
        handleApply,
        clearPendingApplication,

        // Toasts
        toasts,
        addToast,
        removeToast
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
}

