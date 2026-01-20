import './ApplicationTimeline.css';

const STATUS_CONFIG = {
    applied: {
        label: 'Applied',
        color: 'primary',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
        )
    },
    interview: {
        label: 'Interview',
        color: 'warning',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
        )
    },
    offer: {
        label: 'Offer',
        color: 'success',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="8" r="7" />
                <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
            </svg>
        )
    },
    rejected: {
        label: 'Rejected',
        color: 'error',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
        )
    }
};

export default function ApplicationTimeline({ statusHistory }) {
    if (!statusHistory || statusHistory.length === 0) return null;

    return (
        <div className="application-timeline">
            {statusHistory.map((entry, index) => {
                const config = STATUS_CONFIG[entry.status];
                const isLast = index === statusHistory.length - 1;

                return (
                    <div key={index} className={`timeline-item ${config.color} ${isLast ? 'current' : ''}`}>
                        <div className="timeline-marker">
                            {config.icon}
                        </div>
                        {!isLast && <div className="timeline-line" />}
                        <div className="timeline-content">
                            <span className="timeline-label">{config.label}</span>
                            <span className="timeline-date">
                                {new Date(entry.timestamp).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
