import JobCard from './JobCard';
import './BestMatches.css';

export default function BestMatches({ jobs }) {
    if (!jobs || jobs.length === 0) return null;

    return (
        <section className="best-matches">
            <div className="best-matches-header">
                <div className="header-content">
                    <h2>
                        <span className="header-icon">✨</span>
                        Best Matches For You
                    </h2>
                    <p className="header-subtitle">
                        Jobs that align best with your resume and skills
                    </p>
                </div>
                <span className="match-count">{jobs.length} jobs</span>
            </div>

            <div className="best-matches-grid">
                {jobs.map((job) => (
                    <JobCard key={job.id} job={job} compact />
                ))}
            </div>
        </section>
    );
}
