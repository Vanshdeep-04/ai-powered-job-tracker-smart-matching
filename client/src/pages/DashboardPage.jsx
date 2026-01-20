import { useState } from 'react';
import { useApp } from '../context/AppContext';
import ApplicationTimeline from '../components/ApplicationTimeline';
import './DashboardPage.css';

const STATUS_OPTIONS = [
    { value: 'all', label: 'All Applications' },
    { value: 'applied', label: 'Applied' },
    { value: 'interview', label: 'Interview' },
    { value: 'offer', label: 'Offer' },
    { value: 'rejected', label: 'Rejected' }
];

export default function DashboardPage() {
    const { applications, applicationsStats, updateApplicationStatus } = useApp();
    const [statusFilter, setStatusFilter] = useState('all');
    const [expandedApp, setExpandedApp] = useState(null);

    const filteredApplications = statusFilter === 'all'
        ? applications
        : applications.filter(app => app.status === statusFilter);

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'applied': return 'primary';
            case 'interview': return 'warning';
            case 'offer': return 'success';
            case 'rejected': return 'error';
            default: return 'gray';
        }
    };

    const handleStatusChange = async (applicationId, newStatus) => {
        await updateApplicationStatus(applicationId, newStatus);
    };

    return (
        <div className="dashboard-page">
            <header className="dashboard-header">
                <div className="header-content">
                    <h1>Application Dashboard</h1>
                    <p className="header-subtitle">Track and manage your job applications</p>
                </div>
            </header>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card total">
                    <div className="stat-icon">📋</div>
                    <div className="stat-content">
                        <span className="stat-value">{applicationsStats.total}</span>
                        <span className="stat-label">Total Applications</span>
                    </div>
                </div>
                <div className="stat-card applied">
                    <div className="stat-icon">✅</div>
                    <div className="stat-content">
                        <span className="stat-value">{applicationsStats.applied}</span>
                        <span className="stat-label">Applied</span>
                    </div>
                </div>
                <div className="stat-card interview">
                    <div className="stat-icon">📅</div>
                    <div className="stat-content">
                        <span className="stat-value">{applicationsStats.interview}</span>
                        <span className="stat-label">Interviews</span>
                    </div>
                </div>
                <div className="stat-card offer">
                    <div className="stat-icon">🎉</div>
                    <div className="stat-content">
                        <span className="stat-value">{applicationsStats.offer}</span>
                        <span className="stat-label">Offers</span>
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="filter-tabs">
                {STATUS_OPTIONS.map((option) => (
                    <button
                        key={option.value}
                        className={`filter-tab ${statusFilter === option.value ? 'active' : ''}`}
                        onClick={() => setStatusFilter(option.value)}
                    >
                        {option.label}
                        {option.value !== 'all' && (
                            <span className="tab-count">
                                {applicationsStats[option.value] || 0}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Applications List */}
            <div className="applications-list">
                {filteredApplications.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📭</div>
                        <h3>No applications yet</h3>
                        <p>Start applying to jobs and track your progress here</p>
                    </div>
                ) : (
                    filteredApplications.map((app) => (
                        <div
                            key={app.id}
                            className={`application-card ${expandedApp === app.id ? 'expanded' : ''}`}
                        >
                            <div
                                className="application-header"
                                onClick={() => setExpandedApp(expandedApp === app.id ? null : app.id)}
                            >
                                <div className="application-info">
                                    <div className="company-initial">
                                        {app.company.charAt(0)}
                                    </div>
                                    <div className="application-details">
                                        <h3 className="job-title">{app.jobTitle}</h3>
                                        <p className="company-name">{app.company}</p>
                                    </div>
                                </div>

                                <div className="application-meta">
                                    {app.matchScore && (
                                        <span className={`match-badge ${app.matchScore >= 70 ? 'high' : app.matchScore >= 40 ? 'medium' : 'low'}`}>
                                            {app.matchScore}% match
                                        </span>
                                    )}
                                    <span className={`status-badge ${getStatusBadgeClass(app.status)}`}>
                                        {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                                    </span>
                                    <span className="application-date">
                                        Applied {new Date(app.createdAt).toLocaleDateString()}
                                    </span>
                                    <button
                                        className="expand-btn"
                                        aria-label={expandedApp === app.id ? 'Collapse' : 'Expand'}
                                    >
                                        <svg
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            style={{ transform: expandedApp === app.id ? 'rotate(180deg)' : 'rotate(0deg)' }}
                                        >
                                            <polyline points="6 9 12 15 18 9" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {expandedApp === app.id && (
                                <div className="application-expanded">
                                    <div className="expanded-content">
                                        <div className="timeline-section">
                                            <h4>Application Timeline</h4>
                                            <ApplicationTimeline statusHistory={app.statusHistory} />
                                        </div>

                                        <div className="actions-section">
                                            <h4>Update Status</h4>
                                            <div className="status-actions">
                                                {['applied', 'interview', 'offer', 'rejected'].map((status) => (
                                                    <button
                                                        key={status}
                                                        className={`status-btn ${status} ${app.status === status ? 'active' : ''}`}
                                                        onClick={() => handleStatusChange(app.id, status)}
                                                        disabled={app.status === status}
                                                    >
                                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                                    </button>
                                                ))}
                                            </div>

                                            {app.applyLink && (
                                                <a
                                                    href={app.applyLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="btn btn-secondary view-job-btn"
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                                        <polyline points="15 3 21 3 21 9" />
                                                        <line x1="10" y1="14" x2="21" y2="3" />
                                                    </svg>
                                                    View Original Posting
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
