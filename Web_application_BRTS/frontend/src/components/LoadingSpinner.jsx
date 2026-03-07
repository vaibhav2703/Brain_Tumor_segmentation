import React from 'react'

export default function LoadingSpinner({ fileName, progress }) {
    return (
        <div className="mt-16 flex flex-col items-center justify-center animate-fade-in">
            {/* Spinner */}
            <div className="relative mb-8">
                <div className="spinner-ring" />
                <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ color: 'var(--accent-indigo)' }}
                >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2a7 7 0 0 0-7 7c0 3 1.5 5.5 3 7.5S12 22 12 22s2.5-3.5 4-5.5S19 12 19 9a7 7 0 0 0-7-7z" />
                        <circle cx="12" cy="9" r="2.5" />
                    </svg>
                </div>
            </div>

            {/* Text */}
            <h3 className="text-2xl font-bold mb-2 outfit-font tracking-wide" style={{ color: 'var(--text-primary)' }}>
                Analyzing Brain Scan
            </h3>
            <p className="text-sm mb-1 font-medium tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                Running 3D segmentation inference...
            </p>
            {fileName && (
                <p className="text-xs font-mono px-3 py-1 rounded-lg mb-6" style={{
                    color: 'var(--text-muted)',
                    background: 'rgba(99, 102, 241, 0.06)',
                }}>
                    {fileName}
                </p>
            )}

            {/* Steps */}
            <div className="glass-card p-6 w-full max-w-sm mt-4">
                <div className="space-y-3">
                    {[
                        { label: 'Uploading file', done: progress >= 100 },
                        { label: 'Loading & preprocessing NIfTI', done: false },
                        { label: 'Running sliding window inference', done: false },
                        { label: 'Post-processing segmentation', done: false },
                        { label: 'Generating visualization', done: false },
                    ].map((step, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <div
                                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                                style={{
                                    background: step.done
                                        ? 'rgba(16, 185, 129, 0.15)'
                                        : i === 0 && progress > 0 && progress < 100
                                            ? 'rgba(99, 102, 241, 0.15)'
                                            : 'rgba(100, 116, 139, 0.1)',
                                    border: `1px solid ${step.done
                                        ? 'rgba(16, 185, 129, 0.4)'
                                        : i === 0 && progress > 0 && progress < 100
                                            ? 'rgba(99, 102, 241, 0.4)'
                                            : 'rgba(100, 116, 139, 0.2)'
                                        }`,
                                }}
                            >
                                {step.done ? (
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                ) : (
                                    <div
                                        className="w-1.5 h-1.5 rounded-full"
                                        style={{
                                            background:
                                                i === 0 && progress > 0
                                                    ? 'var(--accent-indigo)'
                                                    : 'var(--text-muted)',
                                        }}
                                    />
                                )}
                            </div>
                            <span
                                className="text-sm"
                                style={{
                                    color: step.done
                                        ? 'var(--accent-emerald)'
                                        : i === 0 && progress > 0
                                            ? 'var(--text-primary)'
                                            : 'var(--text-muted)',
                                }}
                            >
                                {step.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
