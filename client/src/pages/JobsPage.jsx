import { useState, useEffect, useCallback } from 'react';
import { jobsAPI } from '../services/api';
import JobFilters from '../components/JobFilters';
import JobCard from '../components/JobCard';
import BestMatches from '../components/BestMatches';
import AISidebar from '../components/AISidebar';
import { useApp } from '../context/AppContext';
import './JobsPage.css';

export default function JobsPage() {
    const { resume, setShowResumeModal } = useApp();
    const [jobs, setJobs] = useState([]);
    const [bestMatches, setBestMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        role: '',
        skills: [],
        datePosted: '',
        jobType: '',
        workMode: '',
        location: '',
        matchScore: ''
    });

    const fetchJobs = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await jobsAPI.getJobs(filters);

            if (response.data.success) {
                setJobs(response.data.jobs);
                setBestMatches(response.data.bestMatches || []);
            } else {
                setError('Failed to fetch jobs');
            }
        } catch (err) {
            console.error('Error fetching jobs:', err);
            setError('Failed to fetch jobs. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);

    // Refetch when resume changes
    useEffect(() => {
        if (resume) {
            fetchJobs();
        }
    }, [resume, fetchJobs]);

    const handleFilterChange = (newFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    };

    const handleAIFilterChange = (aiFilters) => {
        setFilters(prev => ({ ...prev, ...aiFilters }));
    };

    return (
        <div className="jobs-page">
            <JobFilters filters={filters} onFilterChange={handleFilterChange} />

            <main className="jobs-main">
                {!resume && (
                    <div className="resume-prompt">
                        <div className="prompt-content">
                            <div className="prompt-icon">📄</div>
                            <div className="prompt-text">
                                <h3>Get personalized job matches</h3>
                                <p>Upload your resume to see AI-powered match scores for every job</p>
                            </div>
                            <button
                                className="btn btn-primary"
                                onClick={() => setShowResumeModal(true)}
                            >
                                Upload Resume
                            </button>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="jobs-loading">
                        <div className="loading-grid">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="job-skeleton">
                                    <div className="skeleton-header">
                                        <div className="skeleton skeleton-avatar"></div>
                                        <div className="skeleton-info">
                                            <div className="skeleton skeleton-title"></div>
                                            <div className="skeleton skeleton-subtitle"></div>
                                        </div>
                                    </div>
                                    <div className="skeleton skeleton-meta"></div>
                                    <div className="skeleton skeleton-tags"></div>
                                    <div className="skeleton skeleton-description"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : error ? (
                    <div className="jobs-error">
                        <div className="error-icon">⚠️</div>
                        <h3>Something went wrong</h3>
                        <p>{error}</p>
                        <button className="btn btn-primary" onClick={fetchJobs}>
                            Try Again
                        </button>
                    </div>
                ) : (
                    <>
                        {bestMatches.length > 0 && resume && (
                            <BestMatches jobs={bestMatches} />
                        )}

                        <section className="all-jobs">
                            <div className="section-header">
                                <h2>
                                    {filters.role || filters.skills.length > 0
                                        ? 'Search Results'
                                        : 'All Jobs'}
                                </h2>
                                <span className="job-count">{jobs.length} jobs found</span>
                            </div>

                            {jobs.length === 0 ? (
                                <div className="no-jobs">
                                    <div className="no-jobs-icon">🔍</div>
                                    <h3>No jobs found</h3>
                                    <p>Try adjusting your filters or search criteria</p>
                                </div>
                            ) : (
                                <div className="jobs-grid">
                                    {jobs.map((job) => (
                                        <JobCard key={job.id} job={job} />
                                    ))}
                                </div>
                            )}
                        </section>
                    </>
                )}
            </main>

            <AISidebar onFilterChange={handleAIFilterChange} />
        </div>
    );
}
