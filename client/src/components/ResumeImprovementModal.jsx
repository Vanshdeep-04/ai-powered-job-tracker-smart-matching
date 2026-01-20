import { useState } from 'react';
import { resumeImprovementAPI } from '../services/api';
import './ResumeImprovementModal.css';

export default function ResumeImprovementModal({ job, onClose }) {
    const [loading, setLoading] = useState(false);
    const [suggestions, setSuggestions] = useState(null);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('keywords');

    const fetchSuggestions = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await resumeImprovementAPI.getSuggestions(job);
            if (response.data.success) {
                setSuggestions(response.data.suggestions);
            } else {
                setError(response.data.error || 'Failed to get suggestions');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Please upload your resume first to get improvement suggestions');
        } finally {
            setLoading(false);
        }
    };

    // Fetch on mount
    useState(() => {
        fetchSuggestions();
    }, []);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal resume-improvement-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-header-content">
                        <h2 className="modal-title">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <path d="M12 18v-6" />
                                <path d="M9 15l3 3 3-3" />
                            </svg>
                            Improve Resume for This Job
                        </h2>
                        <p className="modal-subtitle">{job.title} at {job.company}</p>
                    </div>
                    <button className="modal-close" onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <div className="modal-body">
                    {loading && (
                        <div className="improvement-loading">
                            <div className="spinner"></div>
                            <p>Analyzing your resume...</p>
                        </div>
                    )}

                    {error && (
                        <div className="improvement-error">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <p>{error}</p>
                            <button className="btn btn-primary" onClick={fetchSuggestions}>
                                Try Again
                            </button>
                        </div>
                    )}

                    {suggestions && !loading && !error && (
                        <>
                            {/* Summary Card */}
                            <div className="improvement-summary">
                                <div className="summary-score">
                                    <div className={`score-circle ${suggestions.overallScore >= 70 ? 'high' : suggestions.overallScore >= 40 ? 'medium' : 'low'}`}>
                                        {suggestions.overallScore}%
                                    </div>
                                    <span>Match Score</span>
                                </div>
                                <p className="summary-text">{suggestions.summary}</p>
                            </div>

                            {/* Tabs */}
                            <div className="improvement-tabs">
                                <button
                                    className={`tab-btn ${activeTab === 'keywords' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('keywords')}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                                        <line x1="7" y1="7" x2="7.01" y2="7" />
                                    </svg>
                                    Missing Keywords
                                    {suggestions.missingKeywords?.length > 0 && (
                                        <span className="tab-count">{suggestions.missingKeywords.length}</span>
                                    )}
                                </button>
                                <button
                                    className={`tab-btn ${activeTab === 'bullets' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('bullets')}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="8" y1="6" x2="21" y2="6" />
                                        <line x1="8" y1="12" x2="21" y2="12" />
                                        <line x1="8" y1="18" x2="21" y2="18" />
                                        <line x1="3" y1="6" x2="3.01" y2="6" />
                                        <line x1="3" y1="12" x2="3.01" y2="12" />
                                        <line x1="3" y1="18" x2="3.01" y2="18" />
                                    </svg>
                                    Better Bullets
                                </button>
                                <button
                                    className={`tab-btn ${activeTab === 'skills' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('skills')}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                        <polyline points="22 4 12 14.01 9 11.01" />
                                    </svg>
                                    Skill Gaps
                                </button>
                            </div>

                            {/* Tab Content */}
                            <div className="tab-content">
                                {activeTab === 'keywords' && (
                                    <div className="keywords-list">
                                        {suggestions.missingKeywords?.length > 0 ? (
                                            suggestions.missingKeywords.map((item, index) => (
                                                <div key={index} className={`keyword-item ${item.importance}`}>
                                                    <div className="keyword-header">
                                                        <span className="keyword-name">{item.keyword}</span>
                                                        <span className={`keyword-priority ${item.importance}`}>
                                                            {item.importance === 'high' ? '🔴 High Priority' : '🟡 Medium Priority'}
                                                        </span>
                                                    </div>
                                                    <p className="keyword-suggestion">{item.suggestion}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="no-items">
                                                <span>✅</span>
                                                <p>Great! Your resume already includes all key keywords for this job.</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'bullets' && (
                                    <div className="bullets-list">
                                        {suggestions.bulletPointImprovements?.map((item, index) => (
                                            <div key={index} className="bullet-item">
                                                <div className="bullet-original">
                                                    <span className="bullet-label">❌ Weak</span>
                                                    <p>{item.original}</p>
                                                </div>
                                                <div className="bullet-arrow">→</div>
                                                <div className="bullet-improved">
                                                    <span className="bullet-label">✅ Stronger</span>
                                                    <p>{item.improved}</p>
                                                </div>
                                                <p className="bullet-reason">
                                                    <strong>Why:</strong> {item.reason}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {activeTab === 'skills' && (
                                    <div className="skills-list">
                                        {suggestions.skillGaps?.length > 0 ? (
                                            suggestions.skillGaps.map((item, index) => (
                                                <div key={index} className={`skill-gap-item ${item.priority}`}>
                                                    <div className="skill-header">
                                                        <span className="skill-name">{item.skill}</span>
                                                        <span className={`skill-priority ${item.priority}`}>
                                                            {item.priority === 'high' ? 'High' : item.priority === 'medium' ? 'Medium' : 'Low'} Priority
                                                        </span>
                                                    </div>
                                                    <p className="skill-suggestion">{item.howToAddress}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="no-items">
                                                <span>🎉</span>
                                                <p>Excellent! You have all the skills needed for this role.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>
                        Close
                    </button>
                    {suggestions && (
                        <button
                            className="btn btn-primary"
                            onClick={() => {
                                // Could add copy to clipboard or download functionality
                                const text = `Resume Improvement Suggestions for ${job.title}\n\n${suggestions.summary}`;
                                navigator.clipboard.writeText(text);
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                            Copy Summary
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
