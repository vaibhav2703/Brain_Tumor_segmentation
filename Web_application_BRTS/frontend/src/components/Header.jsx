import React from 'react'

export default function Header() {
    return (
        <header style={{ width: '100%', paddingTop: '1rem', paddingBottom: '1rem', position: 'sticky', top: 0, zIndex: 50, display: 'flex', justifyContent: 'center' }}>
            <div style={{
                width: '100%',
                maxWidth: '56rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1.5rem',
                borderRadius: '1rem',
                background: 'rgba(10, 10, 20, 0.65)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)'
            }}>
                {/* Logo / Brand */}
                <div className="flex items-center gap-4">
                    <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center relative overflow-hidden"
                        style={{
                            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                            boxShadow: '0 8px 20px rgba(99, 102, 241, 0.4)',
                        }}
                    >
                        <div className="absolute inset-0 bg-white/20" style={{ mixBlendMode: 'overlay' }}></div>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="relative z-10">
                            <path d="M12 2a7 7 0 0 0-7 7c0 3 1.5 5.5 3 7.5S12 22 12 22s2.5-3.5 4-5.5S19 12 19 9a7 7 0 0 0-7-7z" />
                            <circle cx="12" cy="9" r="2.5" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight outfit-font">
                            <span className="gradient-text">BrainSeg</span>
                            <span style={{ color: 'var(--text-secondary)', fontWeight: 300 }}> AI</span>
                        </h1>
                        <p className="text-xs font-medium tracking-wide" style={{ color: 'var(--text-muted)' }}>
                            3D TUMOR SEGMENTATION
                        </p>
                    </div>
                </div>

                {/* Status Badge */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <div className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </div>
                    <span className="text-xs font-semibold tracking-wide" style={{ color: '#34d399' }}>
                        SYSTEM READY
                    </span>
                </div>
            </div>
        </header>
    )
}
