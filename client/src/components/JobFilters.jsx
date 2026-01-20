import { useState } from 'react';
import './JobFilters.css';

const SKILLS_OPTIONS = [
    'React', 'Node.js', 'Python', 'JavaScript', 'TypeScript',
    'Java', 'Go', 'AWS', 'Docker', 'Kubernetes', 'SQL',
    'MongoDB', 'GraphQL', 'Vue.js', 'Angular', 'Flutter'
];

export default function JobFilters({ filters, onFilterChange }) {
    const [showAllSkills, setShowAllSkills] = useState(false);

    const handleChange = (key, value) => {
        onFilterChange({ ...filters, [key]: value });
    };

    const handleSkillToggle = (skill) => {
        const currentSkills = filters.skills || [];
        const newSkills = currentSkills.includes(skill)
            ? currentSkills.filter(s => s !== skill)
            : [...currentSkills, skill];
        handleChange('skills', newSkills);
    };

    const clearFilters = () => {
        onFilterChange({
            role: '',
            skills: [],
            datePosted: '',
            jobType: '',
            workMode: '',
            location: '',
            matchScore: ''
        });
    };

    const hasActiveFilters = () => {
        return filters.role ||
            (filters.skills && filters.skills.length > 0) ||
            filters.datePosted ||
            filters.jobType ||
            filters.workMode ||
            filters.location ||
            filters.matchScore;
    };

    const displayedSkills = showAllSkills ? SKILLS_OPTIONS : SKILLS_OPTIONS.slice(0, 8);

    return (
        <aside className="job-filters">
            <div className="filters-header">
                <h3>Filters</h3>
                {hasActiveFilters() && (
                    <button className="clear-filters-btn" onClick={clearFilters}>
                        Clear all
                    </button>
                )}
            </div>

            {/* Search by Role */}
            <div className="filter-group">
                <label className="filter-label">Role / Title</label>
                <div className="input-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                        type="text"
                        className="input"
                        placeholder="e.g. Frontend Developer"
                        value={filters.role || ''}
                        onChange={(e) => handleChange('role', e.target.value)}
                    />
                </div>
            </div>

            {/* Location */}
            <div className="filter-group">
                <label className="filter-label">Location</label>
                <div className="input-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                    </svg>
                    <input
                        type="text"
                        className="input"
                        placeholder="e.g. San Francisco"
                        value={filters.location || ''}
                        onChange={(e) => handleChange('location', e.target.value)}
                    />
                </div>
            </div>

            {/* Skills */}
            <div className="filter-group">
                <label className="filter-label">Skills</label>
                <div className="skills-grid">
                    {displayedSkills.map((skill) => (
                        <button
                            key={skill}
                            className={`skill-filter-btn ${filters.skills?.includes(skill) ? 'active' : ''}`}
                            onClick={() => handleSkillToggle(skill)}
                        >
                            {skill}
                        </button>
                    ))}
                </div>
                {SKILLS_OPTIONS.length > 8 && (
                    <button
                        className="show-more-btn"
                        onClick={() => setShowAllSkills(!showAllSkills)}
                    >
                        {showAllSkills ? 'Show less' : `+${SKILLS_OPTIONS.length - 8} more`}
                    </button>
                )}
            </div>

            {/* Date Posted */}
            <div className="filter-group">
                <label className="filter-label">Date Posted</label>
                <div className="radio-group">
                    {[
                        { value: '', label: 'Any time' },
                        { value: 'last24h', label: 'Last 24 hours' },
                        { value: 'lastWeek', label: 'Last week' },
                        { value: 'lastMonth', label: 'Last month' }
                    ].map((option) => (
                        <label key={option.value} className="radio-option">
                            <input
                                type="radio"
                                name="datePosted"
                                checked={filters.datePosted === option.value}
                                onChange={() => handleChange('datePosted', option.value)}
                            />
                            <span className="radio-label">{option.label}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Job Type */}
            <div className="filter-group">
                <label className="filter-label">Job Type</label>
                <select
                    className="input select"
                    value={filters.jobType || ''}
                    onChange={(e) => handleChange('jobType', e.target.value)}
                >
                    <option value="">All types</option>
                    <option value="fulltime">Full-time</option>
                    <option value="parttime">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                </select>
            </div>

            {/* Work Mode */}
            <div className="filter-group">
                <label className="filter-label">Work Mode</label>
                <div className="button-group">
                    {[
                        { value: '', label: 'All', icon: null },
                        { value: 'remote', label: 'Remote', icon: '🌍' },
                        { value: 'hybrid', label: 'Hybrid', icon: '🏢' },
                        { value: 'onsite', label: 'On-site', icon: '📍' }
                    ].map((option) => (
                        <button
                            key={option.value}
                            className={`mode-btn ${filters.workMode === option.value ? 'active' : ''}`}
                            onClick={() => handleChange('workMode', option.value)}
                        >
                            {option.icon && <span>{option.icon}</span>}
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Match Score */}
            <div className="filter-group">
                <label className="filter-label">Match Score</label>
                <div className="match-score-filters">
                    {[
                        { value: '', label: 'All', color: null },
                        { value: 'high', label: 'High (>70%)', color: 'success' },
                        { value: 'medium', label: 'Medium (40-70%)', color: 'warning' }
                    ].map((option) => (
                        <button
                            key={option.value}
                            className={`match-filter-btn ${option.color || ''} ${filters.matchScore === option.value ? 'active' : ''}`}
                            onClick={() => handleChange('matchScore', option.value)}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>
        </aside>
    );
}
