import React, { useState } from 'react'

function App() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [message, setMessage] = useState('')
    const [messageType, setMessageType] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setMessage('')
        setMessageType('')

        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            })

            const data = await response.json()

            if (response.ok && data.success) {
                setMessage(data.message || 'Access Granted')
                setMessageType('success')

                // Don't display the flag - it's only in response headers for advanced users
                // The flag is sent as X-CTF-Flag header for those who know to look

                // Fetch reward URL from backend (hidden from inspection)
                if (data.redirect) {
                    try {
                        const rewardResponse = await fetch('/reward')
                        const rewardData = await rewardResponse.json()
                        if (rewardData.url) {
                            // Redirect after 3 seconds
                            setTimeout(() => {
                                window.location.href = rewardData.url
                            }, 3000)
                        }
                    } catch (error) {
                        console.log('Reward fetch failed, but login was successful')
                        // Still redirect to a fallback or just stay on page
                    }
                }
            } else {
                setMessage(data.message || 'Access Denied')
                setMessageType('error')
            }
        } catch (error) {
            setMessage('Connection Error: Could not reach the server.')
            setMessageType('error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="login-card">
            <div className="login-content">
                <div className="header-section">
                    <div className="shield-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <h1 className="title">Medusa 2.0</h1>
                    <p className="subtitle">SECURE LOGIN PORTAL</p>
                </div>

                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="input-container">
                        <div className="input-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2" />
                                <circle cx="12" cy="16" r="1" fill="currentColor" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Enter username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-container">
                        <div className="input-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2" />
                                <circle cx="12" cy="16" r="1" fill="currentColor" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2" />
                            </svg>
                        </div>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="Enter password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="login-button"
                        disabled={loading}
                    >
                        {loading ? 'Authenticating...' : 'Sign In'}
                    </button>
                </form>

                {message && (
                    <div className={`message ${messageType}`}>
                        {message}
                    </div>
                )}

                <div className="hint">
                    💡 Security researchers: Test for SQL injection & common vulns
                </div>
            </div>
        </div>
    )
}

export default App
