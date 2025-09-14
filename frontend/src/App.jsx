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
                        // Silent fail
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
        <div className="ctf-wrapper">
            <div className="ctf-card">
                <img
                    src="/medusa.svg"
                    alt="MEDUSA"
                    className="ctf-logo"
                />
                <p className="ctf-subtitle">You need to SELECT the right approach</p>
                <form onSubmit={handleSubmit} className="ctf-form">
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        className="ctf-input"
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="ctf-input"
                    />
                    <button type="submit" className="ctf-button" disabled={loading}>
                        {loading ? 'Authenticating...' : 'Attempt Login'}
                    </button>
                </form>
                {message && (
                    <div className={`ctf-message ${messageType}`}>{message}</div>
                )}
            </div>
        </div>
    )
}

export default App
