import { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import './ResumeUpload.css';

export default function ResumeUpload() {
    const { resume, uploadResume, deleteResume, showResumeModal, setShowResumeModal } = useApp();
    const [dragActive, setDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    if (!showResumeModal) return null;

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const file = e.dataTransfer.files?.[0];
        if (file) {
            handleFile(file);
        }
    };

    const handleFile = async (file) => {
        setError('');

        // Validate file type
        const validTypes = ['application/pdf', 'text/plain'];
        if (!validTypes.includes(file.type)) {
            setError('Please upload a PDF or TXT file');
            return;
        }

        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
            setError('File size must be less than 10MB');
            return;
        }

        setUploading(true);
        const success = await uploadResume(file);
        setUploading(false);

        if (success) {
            setShowResumeModal(false);
        }
    };

    const handleInputChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFile(file);
        }
    };

    const handleDelete = async () => {
        const success = await deleteResume();
        if (success) {
            setShowResumeModal(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={() => setShowResumeModal(false)}>
            <div className="modal resume-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">
                        {resume ? 'Update Resume' : 'Upload Your Resume'}
                    </h2>
                    <button
                        className="modal-close"
                        onClick={() => setShowResumeModal(false)}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <div className="modal-body">
                    {resume ? (
                        <div className="current-resume">
                            <div className="resume-info">
                                <div className="resume-icon">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                        <polyline points="14 2 14 8 20 8" />
                                        <line x1="16" y1="13" x2="8" y2="13" />
                                        <line x1="16" y1="17" x2="8" y2="17" />
                                    </svg>
                                </div>
                                <div className="resume-details">
                                    <p className="resume-filename">{resume.filename}</p>
                                    <p className="resume-meta">
                                        Uploaded {new Date(resume.uploadedAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <span className="resume-status">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    Active
                                </span>
                            </div>

                            <div className="resume-actions">
                                <button
                                    className="btn btn-secondary"
                                    onClick={handleDelete}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="3 6 5 6 21 6" />
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                    </svg>
                                    Remove
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="17 8 12 3 7 8" />
                                        <line x1="12" y1="3" x2="12" y2="15" />
                                    </svg>
                                    Replace
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <p className="upload-description">
                                Upload your resume to get personalized job matches with AI-powered scoring.
                                We support PDF and TXT files.
                            </p>

                            <div
                                className={`drop-zone ${dragActive ? 'active' : ''} ${uploading ? 'uploading' : ''}`}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                                onClick={() => !uploading && fileInputRef.current?.click()}
                            >
                                {uploading ? (
                                    <div className="upload-loading">
                                        <div className="spinner"></div>
                                        <p>Uploading and processing...</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="drop-zone-icon">
                                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                <polyline points="17 8 12 3 7 8" />
                                                <line x1="12" y1="3" x2="12" y2="15" />
                                            </svg>
                                        </div>
                                        <p className="drop-zone-text">
                                            <span className="highlight">Click to upload</span> or drag and drop
                                        </p>
                                        <p className="drop-zone-hint">PDF or TXT (max 10MB)</p>
                                    </>
                                )}
                            </div>
                        </>
                    )}

                    {error && (
                        <div className="upload-error">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.txt,application/pdf,text/plain"
                        onChange={handleInputChange}
                        style={{ display: 'none' }}
                    />

                    <div className="upload-benefits">
                        <h4>Why upload your resume?</h4>
                        <ul>
                            <li>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                Get AI-powered match scores for every job
                            </li>
                            <li>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                See which skills match and which to develop
                            </li>
                            <li>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                Find your best matching opportunities first
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
