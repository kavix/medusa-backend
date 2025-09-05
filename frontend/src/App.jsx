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

                // Redirect after 3 seconds
                setTimeout(() => {
                    window.location.href = 'https://kodegas.com'
                }, 3000)
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
        <div className="app-container">
            <h1 className="title">Medusa 2.0</h1>
            <p className="subtitle">Secure Login Portal</p>

            <form className="login-form" onSubmit={handleSubmit}>
                <input
                    type="text"
                    className="form-input"
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
                <input
                    type="password"
                    className="form-input"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
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
                <small>💡 Security researchers: Check for common vulnerabilities</small>
            </div>
        </div>
    )
}

export default App
