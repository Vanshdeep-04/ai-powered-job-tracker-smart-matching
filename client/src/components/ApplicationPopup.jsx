import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useVisibilityChange } from '../hooks/useWindowFocus';
import './ApplicationPopup.css';

export default function ApplicationPopup() {
    const {
        pendingApplication,
        clearPendingApplication,
        trackApplication
    } = useApp();

    const [showPopup, setShowPopup] = useState(false);
    const [processing, setProcessing] = useState(false);

    // Handle visibility change (user returns to app)
    const handleVisibilityChange = useCallback(() => {
        if (pendingApplication) {
            // Check if enough time has passed (5 seconds minimum)
            const timeSinceApply = Date.now() - pendingApplication.timestamp;
            if (timeSinceApply > 5000) {
                setShowPopup(true);
            }
        }
    }, [pendingApplication]);

    useVisibilityChange(handleVisibilityChange);

    // Also check on mount in case user was on external site
    useEffect(() => {
        if (pendingApplication) {
            const timeSinceApply = Date.now() - pendingApplication.timestamp;
            if (timeSinceApply > 5000) {
                setShowPopup(true);
            }
        }
    }, [pendingApplication]);

    const handleResponse = async (response) => {
        setProcessing(true);

        if (response === 'yes' || response === 'earlier') {
            await trackApplication(pendingApplication.job);
        }

        clearPendingApplication();
        setShowPopup(false);
        setProcessing(false);
    };

    if (!showPopup || !pendingApplication) return null;

    const { job } = pendingApplication;

    return (
        <div className="popup-overlay">
            <div className="application-popup">
                <div className="popup-header">
                    <div className="popup-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                    </div>
                    <h3>Did you apply?</h3>
                </div>

                <div className="popup-content">
                    <p className="popup-question">
                        Did you apply to <strong>{job.title}</strong> at <strong>{job.company}</strong>?
                    </p>

                    <div className="popup-job-preview">
                        <div className="job-preview-icon">
                            {job.companyLogo ? (
                                <img src={job.companyLogo} alt={job.company} />
                            ) : (
                                <span>{job.company.charAt(0)}</span>
                            )}
                        </div>
                        <div className="job-preview-info">
                            <p className="job-preview-title">{job.title}</p>
                            <p className="job-preview-company">{job.company} • {job.location}</p>
                        </div>
                        {job.matchScore && (
                            <span className={`job-preview-score ${job.matchScore >= 70 ? 'high' : job.matchScore >= 40 ? 'medium' : 'low'}`}>
                                {job.matchScore}%
                            </span>
                        )}
                    </div>
                </div>

                <div className="popup-actions">
                    <button
                        className="popup-btn primary"
                        onClick={() => handleResponse('yes')}
                        disabled={processing}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Yes, Applied
                    </button>
                    <button
                        className="popup-btn secondary"
                        onClick={() => handleResponse('no')}
                        disabled={processing}
                    >
                        No, Just Browsing
                    </button>
                    <button
                        className="popup-btn ghost"
                        onClick={() => handleResponse('earlier')}
                        disabled={processing}
                    >
                        Applied Earlier
                    </button>
                </div>
            </div>
        </div>
    );
}
