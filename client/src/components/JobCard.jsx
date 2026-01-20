import { useState } from 'react';
import { useApp } from '../context/AppContext';
import ResumeImprovementModal from './ResumeImprovementModal';
import './JobCard.css';

export default function JobCard({ job, compact = false }) {
    const { handleApply, applications, resume, toggleSaveJob, isJobSaved } = useApp();
    const [showImprovementModal, setShowImprovementModal] = useState(false);

    const isApplied = applications.some(app => app.jobId === job.id);

    const getScoreBadgeClass = (score) => {
        if (score >= 70) return 'badge-success-dark';
        if (score >= 40) return 'badge-warning-dark';
        return 'badge-gray-dark';
    };

    const getScoreLabel = (score) => {
        if (score >= 70) return 'Strong Match';
        if (score >= 40) return 'Good Match';
        return 'Match';
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return `${Math.floor(diffDays / 30)} months ago`;
    };

    const getWorkModeIcon = (mode) => {
        switch (mode) {
            case 'remote':
                return (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0" />
                        <path d="M3.6 9h16.8M3.6 15h16.8" />
                        <path d="M12 3a15.3 15.3 0 0 1 4 9 15.3 15.3 0 0 1-4 9 15.3 15.3 0 0 1-4-9 15.3 15.3 0 0 1 4-9z" />
                    </svg>
                );
            case 'hybrid':
                return (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                );
            default:
                return (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                    </svg>
                );
        }
    };

    return (
        <>
            <div className={`job-card ${compact ? 'compact' : ''} ${isApplied ? 'applied' : ''}`}>
                <div className="job-card-header">
                    <div className="job-card-company">
                        {job.companyLogo ? (
                            <img src={job.companyLogo} alt={job.company} className="company-logo" />
                        ) : (
                            <div className="company-logo-placeholder">
                                {job.company.charAt(0)}
                            </div>
                        )}
                        <div className="company-info">
                            <h3 className="job-title">{job.title}</h3>
                            <p className="company-name">{job.company}</p>
                        </div>
                    </div>

                    {job.matchScore !== undefined && (
                        <div className={`match-score-badge badge ${getScoreBadgeClass(job.matchScore)}`}>
                            <span className="score-value">{job.matchScore}%</span>
                            <span className="score-label">{getScoreLabel(job.matchScore)}</span>
                        </div>
                    )}
                </div>

                <div className="job-card-meta">
                    <span className="meta-item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                        </svg>
                        {job.location}
                    </span>
                    <span className="meta-item">
                        {getWorkModeIcon(job.workMode)}
                        {job.workMode.charAt(0).toUpperCase() + job.workMode.slice(1)}
                    </span>
                    <span className="meta-item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        {formatDate(job.postedAt)}
                    </span>
                </div>

                <div className="job-card-tags">
                    <span className="job-type-tag">{job.jobType}</span>
                    {job.salary && <span className="salary-tag">{job.salary}</span>}
                </div>

                {!compact && job.description && (
                    <p className="job-description">
                        {job.description.length > 200
                            ? job.description.substring(0, 200) + '...'
                            : job.description}
                    </p>
                )}

                {!compact && job.skills && job.skills.length > 0 && (
                    <div className="job-skills">
                        {job.skills.slice(0, 5).map((skill, index) => (
                            <span
                                key={index}
                                className={`skill-tag ${job.matchData?.matchedSkills?.includes(skill) ? 'matched' : ''}`}
                            >
                                {skill}
                            </span>
                        ))}
                        {job.skills.length > 5 && (
                            <span className="skill-tag more">+{job.skills.length - 5}</span>
                        )}
                    </div>
                )}

                {job.matchData?.explanation && !compact && (
                    <div className="match-explanation">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 15a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm1-4a1 1 0 0 1-2 0V8a1 1 0 0 1 2 0z" />
                        </svg>
                        <p>{job.matchData.explanation}</p>
                    </div>
                )}

                <div className="job-card-actions">
                    {isApplied ? (
                        <span className="applied-badge">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                            Applied
                        </span>
                    ) : (
                        <button
                            className="btn btn-primary"
                            onClick={() => handleApply(job)}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                <polyline points="15 3 21 3 21 9" />
                                <line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                            Apply Now
                        </button>
                    )}

                    {/* Improve Resume Button */}
                    {resume && !compact && (
                        <button
                            className="btn btn-secondary improve-resume-btn"
                            onClick={() => setShowImprovementModal(true)}
                            title="Get AI suggestions to improve your resume for this job"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z" />
                                <path d="M12 16v-4" />
                                <path d="M12 8h.01" />
                            </svg>
                            Improve Resume
                        </button>
                    )}

                    <button
                        className={`btn btn-ghost save-btn ${isJobSaved(job.id) ? 'saved' : ''}`}
                        onClick={() => toggleSaveJob(job)}
                        title={isJobSaved(job.id) ? 'Remove from saved' : 'Save job'}
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill={isJobSaved(job.id) ? 'currentColor' : 'none'}
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Resume Improvement Modal */}
            {showImprovementModal && (
                <ResumeImprovementModal
                    job={job}
                    onClose={() => setShowImprovementModal(false)}
                />
            )}
        </>
    );
}

