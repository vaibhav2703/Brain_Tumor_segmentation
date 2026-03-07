import React, { useState, useCallback } from 'react'
import Header from './components/Header'
import UploadSection from './components/UploadSection'
import ResultsViewer from './components/ResultsViewer'
import LoadingSpinner from './components/LoadingSpinner'
import axios from 'axios'

function App() {
    const [results, setResults] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [uploadedFileName, setUploadedFileName] = useState(null)
    const [uploadProgress, setUploadProgress] = useState(0)

    const handleUpload = useCallback(async (formData, displayName) => {
        setLoading(true)
        setError(null)
        setResults(null)
        setUploadedFileName(displayName)
        setUploadProgress(0)

        try {
            const response = await axios.post('/api/predict', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total)
                    setUploadProgress(pct)
                },
            })

            if (response.data.success) {
                setResults(response.data)
            } else {
                setError(response.data.error || 'Unknown error occurred')
            }
        } catch (err) {
            const msg = err.response?.data?.error || err.message || 'Failed to process the file'
            setError(msg)
        } finally {
            setLoading(false)
            setUploadProgress(0)
        }
    }, [])

    const handleReset = useCallback(() => {
        setResults(null)
        setError(null)
        setUploadedFileName(null)
        setUploadProgress(0)
    }, [])

    return (
        <div style={{ minHeight: '100vh', padding: '0 3px', background: 'transparent' }}>
            {/* Global Constrained Container */}
            <div style={{ width: '100%', maxWidth: '64rem', marginLeft: 'auto', marginRight: 'auto', paddingLeft: '1.5rem', paddingRight: '1.5rem', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                <Header />

                <main style={{ flex: '1', width: '100%', paddingBottom: '4rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    {/* Upload Section */}
                    {!results && !loading && (
                        <div className="animate-fade-in-up w-full" style={{ animationDelay: '0.1s' }}>
                            <UploadSection
                                onUpload={handleUpload}
                                uploadProgress={uploadProgress}
                                error={error}
                            />
                        </div>
                    )}

                    {/* Loading State */}
                    {loading && (
                        <LoadingSpinner
                            fileName={uploadedFileName}
                            progress={uploadProgress}
                        />
                    )}

                    {/* Results */}
                    {results && (
                        <div className="animate-fade-in-up">
                            <ResultsViewer
                                results={results}
                                onReset={handleReset}
                            />
                        </div>
                    )}
                </main>

                {/* Footer */}
                <footer style={{ textAlign: 'center', padding: '1.5rem 0', fontSize: '0.875rem', width: '100%', color: 'var(--text-muted)' }}>
                    <p>Built with MONAI &amp; PyTorch — 3D UNet Brain Tumor Segmentation</p>
                </footer>
            </div>
        </div>
    )
}

export default App
