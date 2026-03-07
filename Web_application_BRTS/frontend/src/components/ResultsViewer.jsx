import React, { useState } from 'react'

const VIEW_MODES = [
    { key: 'overlay', label: 'Overlay' },
    { key: 'segmentation', label: 'Segmentation' },
    { key: 'modalities', label: 'Input Modalities' },
]

const CHANNEL_BADGE_CLASSES = ['badge-tc', 'badge-wt', 'badge-et']

export default function ResultsViewer({ results, onReset }) {
    const [viewMode, setViewMode] = useState('overlay')
    const [activeChannel, setActiveChannel] = useState(null)

    const {
        segmentation_channels,
        input_modalities,
        mri_slice,
        current_slice,
        total_slices,
        input_shape,
        output_shape,
        filename,
        tumor_detected,
        detection_stats,
    } = results

    return (
        <div className="mt-8">
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 mb-8">
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight outfit-font">
                        <span className="gradient-text">Segmentation Results</span>
                    </h2>
                    <p className="text-sm mt-2 font-medium tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                        {filename} · Slice {current_slice + 1} / {total_slices}
                    </p>
                </div>
                <button className="tab-btn" onClick={onReset} id="new-scan-btn">
                    <span className="flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="1 4 1 10 7 10" />
                            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                        </svg>
                        New Scan
                    </span>
                </button>
            </div>

            {/* ─── No Tumor Detected Banner ────────────────────────────── */}
            {!tumor_detected && (
                <div
                    className="mb-6 p-5 rounded-2xl animate-fade-in"
                    style={{
                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(6, 182, 212, 0.06))',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                    }}
                >
                    <div className="flex items-start gap-4">
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: 'rgba(16, 185, 129, 0.12)' }}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-1" style={{ color: '#34d399' }}>
                                No Tumor Detected
                            </h3>
                            <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                                The AI model did not detect any tumor regions in this brain MRI scan.
                                No Tumor Core (TC), Whole Tumor (WT), or Enhancing Tumor (ET) regions were found.
                            </p>
                            <div className="flex items-center gap-3 flex-wrap">
                                {segmentation_channels.map((ch, i) => (
                                    <span
                                        key={i}
                                        className={`badge ${CHANNEL_BADGE_CLASSES[i]}`}
                                        style={{ opacity: ch.detected ? 1 : 0.5 }}
                                    >
                                        {ch.detected ? '●' : '○'} {ch.name.split(' (')[0]}
                                        {ch.detected ? ' — Detected' : ' — Clear'}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Tumor Detected Banner ───────────────────────────────── */}
            {tumor_detected && (
                <div
                    className="mb-6 p-5 rounded-2xl animate-fade-in"
                    style={{
                        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.06), rgba(249, 115, 22, 0.04))',
                        border: '1px solid rgba(239, 68, 68, 0.15)',
                    }}
                >
                    <div className="flex items-start gap-4">
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: 'rgba(239, 68, 68, 0.1)' }}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                <line x1="12" y1="9" x2="12" y2="13" />
                                <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-1" style={{ color: '#f87171' }}>
                                Tumor Detected
                            </h3>
                            <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                                The AI model has identified tumor regions in this brain MRI scan.
                            </p>
                            <div className="flex items-center gap-3 flex-wrap">
                                {segmentation_channels.map((ch, i) => (
                                    <span
                                        key={i}
                                        className={`badge ${CHANNEL_BADGE_CLASSES[i]}`}
                                        style={{ opacity: ch.detected ? 1 : 0.5 }}
                                    >
                                        {ch.detected ? '●' : '○'} {ch.name.split(' (')[0]}
                                        {ch.detected ? ` — ${ch.percentage}%` : ' — Clear'}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Metadata Card */}
            <div className="glass-card p-6 mb-8">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    <div>
                        <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Input Shape</p>
                        <p className="text-sm font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {input_shape ? input_shape.slice(1).join(' × ') : '—'}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Output Shape</p>
                        <p className="text-sm font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {output_shape ? output_shape.join(' × ') : '—'}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Total Slices</p>
                        <p className="text-sm font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {total_slices}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Detection</p>
                        <p className="text-sm font-semibold" style={{ color: tumor_detected ? '#f87171' : '#34d399' }}>
                            {tumor_detected ? 'Tumor Found' : 'All Clear'}
                        </p>
                    </div>
                </div>
            </div>

            {/* View Mode Tabs */}
            <div className="flex items-center gap-3 mb-8 flex-wrap">
                {VIEW_MODES.map((mode) => (
                    <button
                        key={mode.key}
                        className={`tab-btn outfit-font tracking-wide px-4 py-2 ${viewMode === mode.key ? 'active' : ''}`}
                        onClick={() => setViewMode(mode.key)}
                    >
                        {mode.label}
                    </button>
                ))}
            </div>

            {/* ─── Overlay View ──────────────────────────────────────────── */}
            {viewMode === 'overlay' && (
                <div className="animate-fade-in">
                    <div className="flex items-center gap-3 mb-6 flex-wrap">
                        <button
                            className={`tab-btn text-xs outfit-font tracking-wide ${activeChannel === null ? 'active' : ''}`}
                            onClick={() => setActiveChannel(null)}
                        >
                            All Channels
                        </button>
                        {segmentation_channels.map((ch, i) => (
                            <button
                                key={i}
                                className={`badge ${CHANNEL_BADGE_CLASSES[i]} cursor-pointer ${activeChannel === i ? 'ring-2 ring-offset-1' : ''}`}
                                style={activeChannel === i ? { ringOffsetColor: 'var(--bg-primary)' } : {}}
                                onClick={() => setActiveChannel(activeChannel === i ? null : i)}
                            >
                                {ch.detected ? '●' : '○'} {ch.name}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {segmentation_channels.map(
                            (ch, i) =>
                                (activeChannel === null || activeChannel === i) && (
                                    <div key={i} className="image-viewer">
                                        <div className="p-3 flex items-center gap-2" style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                            <span className={`badge ${CHANNEL_BADGE_CLASSES[i]}`}>{ch.name}</span>
                                            <span className="text-xs ml-auto" style={{ color: ch.detected ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
                                                {ch.detected ? `${ch.percentage}%` : 'Not detected'}
                                            </span>
                                        </div>
                                        <img
                                            src={`data:image/png;base64,${ch.overlay}`}
                                            alt={`${ch.name} overlay`}
                                            className="w-full"
                                        />
                                    </div>
                                )
                        )}
                    </div>
                </div>
            )}

            {/* ─── Segmentation View ─────────────────────────────────────── */}
            {viewMode === 'segmentation' && (
                <div className="animate-fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="image-viewer">
                            <div className="p-3" style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                                    Original MRI
                                </span>
                            </div>
                            <img
                                src={`data:image/png;base64,${mri_slice}`}
                                alt="Original MRI"
                                className="w-full"
                            />
                        </div>
                        {segmentation_channels.map((ch, i) => (
                            <div key={i} className="image-viewer">
                                <div className="p-3 flex items-center gap-2" style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                    <span className={`badge ${CHANNEL_BADGE_CLASSES[i]}`}>{ch.name}</span>
                                    <span className="text-xs ml-auto" style={{ color: ch.detected ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
                                        {ch.detected ? `${ch.percentage}%` : 'Clear'}
                                    </span>
                                </div>
                                <img
                                    src={`data:image/png;base64,${ch.segmentation}`}
                                    alt={`${ch.name} segmentation`}
                                    className="w-full"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ─── Modalities View ───────────────────────────────────────── */}
            {viewMode === 'modalities' && (
                <div className="animate-fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {input_modalities.map((mod, i) => (
                            <div key={i} className="image-viewer">
                                <div className="p-3" style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                    <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                                        {mod.name}
                                    </span>
                                </div>
                                <img
                                    src={`data:image/png;base64,${mod.image}`}
                                    alt={`${mod.name} modality`}
                                    className="w-full"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ─── Legend ────────────────────────────────────────────────── */}
            <div className="glass-card p-6 mt-10">
                <h3 className="text-sm font-semibold mb-4 outfit-font tracking-wider uppercase" style={{ color: 'var(--text-secondary)' }}>
                    Segmentation Legend
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        { badge: 'badge-tc', name: 'Tumor Core (TC)', desc: 'Merged label 2 & 3 — the solid tumor mass' },
                        { badge: 'badge-wt', name: 'Whole Tumor (WT)', desc: 'Merged labels 1, 2 & 3 — entire tumor region' },
                        { badge: 'badge-et', name: 'Enhancing Tumor (ET)', desc: 'Label 2 — actively enhancing edges' },
                    ].map((item, i) => (
                        <div key={i} className="flex items-start gap-3">
                            <span className={`badge ${item.badge} flex-shrink-0 mt-0.5`}>
                                <span className="w-2 h-2 rounded-full" style={{
                                    background: i === 0 ? '#f87171' : i === 1 ? '#34d399' : '#60a5fa',
                                }} />
                                {item.name.split(' (')[0]}
                            </span>
                            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                                {item.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
