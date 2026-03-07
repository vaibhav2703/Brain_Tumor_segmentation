import React, { useState, useRef, useCallback } from 'react'

const MODALITIES = [
    { key: 'flair', label: 'FLAIR', color: '#6366f1' },
    { key: 't1', label: 'T1', color: '#8b5cf6' },
    { key: 't1ce', label: 'T1ce', color: '#06b6d4' },
    { key: 't2', label: 'T2', color: '#10b981' },
]

export default function UploadSection({ onUpload, uploadProgress, error }) {
    const [uploadMode, setUploadMode] = useState('multi') // 'single' or 'multi'
    const [dragOver, setDragOver] = useState(false)

    // Single file mode
    const [singleFile, setSingleFile] = useState(null)
    const singleFileRef = useRef(null)

    // Multi file mode
    const [modalityFiles, setModalityFiles] = useState({
        flair: null, t1: null, t1ce: null, t2: null,
    })
    const modalityRefs = {
        flair: useRef(null),
        t1: useRef(null),
        t1ce: useRef(null),
        t2: useRef(null),
    }

    const validateFile = (file) => {
        const name = file.name.toLowerCase()
        return name.endsWith('.nii') || name.endsWith('.nii.gz')
    }

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    }

    // ── Single File Handlers ──
    const handleSingleFileSelect = useCallback((file) => {
        if (!file) return
        if (!validateFile(file)) {
            alert('Please upload a NIfTI file (.nii or .nii.gz)')
            return
        }
        setSingleFile(file)
    }, [])

    const handleSingleDrop = useCallback((e) => {
        e.preventDefault()
        setDragOver(false)
        handleSingleFileSelect(e.dataTransfer.files[0])
    }, [handleSingleFileSelect])

    // ── Multi File Handlers ──
    const handleModalityFileSelect = useCallback((key, file) => {
        if (!file) return
        if (!validateFile(file)) {
            alert(`Please upload a NIfTI file (.nii or .nii.gz) for ${key.toUpperCase()}`)
            return
        }
        setModalityFiles(prev => ({ ...prev, [key]: file }))
    }, [])

    const allModalitiesReady = Object.values(modalityFiles).every(f => f !== null)

    // ── Submit ──
    const handleAnalyze = () => {
        const formData = new FormData()

        if (uploadMode === 'single' && singleFile) {
            formData.append('file', singleFile)
            formData.append('mode', 'single')
            onUpload(formData, singleFile.name)
        } else if (uploadMode === 'multi' && allModalitiesReady) {
            for (const key of ['flair', 't1', 't1ce', 't2']) {
                formData.append(key, modalityFiles[key])
            }
            formData.append('mode', 'multi')
            onUpload(formData, `${modalityFiles.flair.name} (+3 modalities)`)
        }
    }

    const handleClear = () => {
        setSingleFile(null)
        setModalityFiles({ flair: null, t1: null, t1ce: null, t2: null })
        if (singleFileRef.current) singleFileRef.current.value = ''
        Object.values(modalityRefs).forEach(ref => {
            if (ref.current) ref.current.value = ''
        })
    }

    return (
        <div style={{ width: '100%' }}>
            {/* Hero */}
            <div style={{ textAlign: 'center', marginBottom: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h2 className="outfit-font" style={{ fontSize: 'clamp(1.75rem, 5vw, 3rem)', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '0.75rem', textWrap: 'balance' }}>
                    <span className="gradient-text">Brain Tumor Segmentation</span>
                </h2>
                <p style={{ fontSize: '1rem', maxWidth: '42rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
                    Upload brain MRI scans and our AI model will segment tumor regions into<br />
                    <span className="badge badge-tc" style={{ margin: '0 0.25rem' }}>TC</span>
                    <span className="badge badge-wt" style={{ margin: '0 0.25rem' }}>WT</span>
                    <span className="badge badge-et" style={{ margin: '0 0.25rem' }}>ET</span> classes.
                </p>
            </div>

            {/* Mode Toggle */}
            <div style={{ maxWidth: '42rem', marginLeft: 'auto', marginRight: 'auto', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.25rem', borderRadius: '0.75rem', background: 'rgba(99, 102, 241, 0.06)', border: '1px solid var(--glass-border)' }}>
                    <button
                        className={`tab-btn ${uploadMode === 'multi' ? 'active' : ''}`}
                        style={{ flex: 1, fontSize: '0.875rem' }}
                        onClick={() => setUploadMode('multi')}
                    >
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                                <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
                            </svg>
                            <span className="outfit-font" style={{ letterSpacing: '0.05em' }}>4 Modality Files</span>
                        </span>
                    </button>
                    <button
                        className={`tab-btn ${uploadMode === 'single' ? 'active' : ''}`}
                        style={{ flex: 1, fontSize: '0.875rem' }}
                        onClick={() => setUploadMode('single')}
                    >
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                            </svg>
                            <span className="outfit-font" style={{ letterSpacing: '0.05em' }}>Single Stacked File</span>
                        </span>
                    </button>
                </div>
            </div>

            <div style={{ width: '100%', marginTop: '1.5rem' }}>
                {/* ──────────── MULTI FILE MODE ──────────── */}
                {uploadMode === 'multi' && (
                    <div className="animate-fade-in" style={{ width: '100%' }}>
                        <div className="glass-card" style={{ padding: '2rem 2rem', width: '100%' }}>
                            <p className="text-sm font-medium mb-8 tracking-wide outfit-font text-center" style={{ color: 'var(--text-secondary)' }}>
                                UPLOAD ONE NIFTI FILE FOR EACH MRI MODALITY:
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {MODALITIES.map(({ key, label, color }) => (
                                    <div
                                        key={key}
                                        className="relative rounded-xl p-4 cursor-pointer transition-all duration-200"
                                        style={{
                                            background: modalityFiles[key]
                                                ? `${color}10`
                                                : 'rgba(255,255,255,0.02)',
                                            border: `1px solid ${modalityFiles[key] ? `${color}40` : 'var(--glass-border)'}`,
                                        }}
                                        onClick={() => modalityRefs[key].current?.click()}
                                    >
                                        <input
                                            ref={modalityRefs[key]}
                                            type="file"
                                            accept=".nii,.gz"
                                            className="hidden"
                                            onChange={(e) => handleModalityFileSelect(key, e.target.files[0])}
                                        />
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                                                style={{ background: `${color}20` }}
                                            >
                                                {modalityFiles[key] ? (
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
                                                        <polyline points="20 6 9 17 4 12" />
                                                    </svg>
                                                ) : (
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
                                                        <line x1="12" y1="5" x2="12" y2="19" />
                                                        <line x1="5" y1="12" x2="19" y2="12" />
                                                    </svg>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                                    {label}
                                                </p>
                                                {modalityFiles[key] ? (
                                                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                                                        {modalityFiles[key].name} · {formatFileSize(modalityFiles[key].size)}
                                                    </p>
                                                ) : (
                                                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                                        Click to select .nii / .nii.gz
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Progress indicator */}
                            <div className="mt-4 flex items-center gap-2">
                                <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(99,102,241,0.1)' }}>
                                    <div
                                        className="h-full rounded-full transition-all duration-300"
                                        style={{
                                            width: `${(Object.values(modalityFiles).filter(Boolean).length / 4) * 100}%`,
                                            background: 'var(--gradient-primary)',
                                        }}
                                    />
                                </div>
                                <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                                    {Object.values(modalityFiles).filter(Boolean).length}/4
                                </span>
                            </div>

                            {/* Buttons */}
                            <div className="mt-8 flex items-center justify-center gap-4">
                                <button
                                    className="btn-primary py-3 px-8 text-lg"
                                    onClick={handleAnalyze}
                                    disabled={!allModalitiesReady}
                                    id="analyze-btn"
                                >
                                    <span className="flex items-center gap-2">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="3" />
                                            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                                        </svg>
                                        Analyze Scan
                                    </span>
                                </button>
                                {Object.values(modalityFiles).some(Boolean) && (
                                    <button className="tab-btn py-3 px-6" onClick={handleClear} id="clear-btn">
                                        Clear All
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ──────────── SINGLE FILE MODE ──────────── */}
                {uploadMode === 'single' && (
                    <div className="animate-fade-in w-full">
                        <div
                            className={`dropzone px-8 sm:px-10 py-16 w-full ${dragOver ? 'drag-over' : ''}`}
                            onClick={() => !singleFile && singleFileRef.current?.click()}
                            onDrop={handleSingleDrop}
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                            onDragLeave={(e) => { e.preventDefault(); setDragOver(false) }}
                            id="dropzone"
                        >
                            <input
                                ref={singleFileRef}
                                type="file"
                                accept=".nii,.gz"
                                onChange={(e) => handleSingleFileSelect(e.target.files[0])}
                                className="hidden"
                                id="file-input"
                            />

                            <div className="relative z-10">
                                {!singleFile ? (
                                    <>
                                        <div className="mx-auto w-16 h-16 mb-5 flex items-center justify-center rounded-2xl animate-float"
                                            style={{ background: 'rgba(99, 102, 241, 0.1)' }}>
                                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                <polyline points="17 8 12 3 7 8" />
                                                <line x1="12" y1="3" x2="12" y2="15" />
                                            </svg>
                                        </div>
                                        <p className="font-semibold text-xl mb-2 outfit-font tracking-wide" style={{ color: 'var(--text-primary)' }}>
                                            Drop your pre-stacked NIfTI file here
                                        </p>
                                        <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
                                            or click to browse · Must be a 4-channel volume (FLAIR + T1 + T1ce + T2)
                                        </p>
                                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                            Accepts <code className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8' }}>.nii</code>{' '}
                                            <code className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8' }}>.nii.gz</code>
                                        </p>
                                    </>
                                ) : (
                                    <div onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center justify-center gap-3 mb-4">
                                            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                                                style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                    <polyline points="14 2 14 8 20 8" />
                                                </svg>
                                            </div>
                                            <div className="text-left">
                                                <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                                                    {singleFile.name}
                                                </p>
                                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                                    {formatFileSize(singleFile.size)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-center gap-3">
                                            <button className="btn-primary" onClick={handleAnalyze} id="analyze-single-btn">
                                                <span className="flex items-center gap-2">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <circle cx="12" cy="12" r="3" />
                                                        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                                                    </svg>
                                                    Analyze Scan
                                                </span>
                                            </button>
                                            <button className="tab-btn" onClick={handleClear} id="clear-single-btn">
                                                Clear
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Upload Progress */}
                {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="mt-4 progress-bar">
                        <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }} />
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div
                        className="mt-4 p-4 rounded-xl text-sm animate-fade-in"
                        style={{
                            background: 'rgba(239, 68, 68, 0.08)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            color: '#f87171',
                        }}
                    >
                        <div className="flex items-start gap-2">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 mt-0.5">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="15" y1="9" x2="9" y2="15" />
                                <line x1="9" y1="9" x2="15" y2="15" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
