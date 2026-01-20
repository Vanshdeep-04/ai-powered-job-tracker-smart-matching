import { useApp } from '../context/AppContext';
import JobCard from '../components/JobCard';
import './SavedJobsPage.css';

export default function SavedJobsPage() {
    const { savedJobs } = useApp();

    return (
        <div className="saved-jobs-page">
            <div className="page-header">
                <h1>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                    Saved Jobs
                </h1>
                <p className="page-subtitle">
                    {savedJobs.length} job{savedJobs.length !== 1 ? 's' : ''} saved
                </p>
            </div>

            {savedJobs.length === 0 ? (
                <div className="empty-state">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                    <h2>No saved jobs yet</h2>
                    <p>Click the bookmark icon on any job to save it for later</p>
                </div>
            ) : (
                <div className="saved-jobs-grid">
                    {savedJobs.map(job => (
                        <JobCard key={job.id} job={job} />
                    ))}
                </div>
            )}
        </div>
    );
}
