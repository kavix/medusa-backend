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
                setMessage(data.message || 'Login successful!')
                setMessageType('success')

                // Check for CTF flag in response headers
                const ctfFlag = response.headers.get('X-CTF-Flag')
                if (ctfFlag) {
                    setTimeout(() => {
                        setMessage(prev => prev + `\n\n🏆 CTF Flag: ${ctfFlag}`)
                    }, 1000)
                }

                // Redirect after 3 seconds
                setTimeout(() => {
                    window.location.href = 'https://kodegas.com'
                }, 3000)
            } else {
                setMessage(data.message || 'Login failed')
                setMessageType('error')
            }
        } catch (error) {
            setMessage('Network error')
            setMessageType('error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="app-container">
            <h1 className="title">Medusa 2.0</h1>
            <h3 className="subtitle">Registration Challenge</h3>

            <form className="login-form" onSubmit={handleSubmit}>
                <input
                    type="text"
                    className="form-input"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
                <input
                    type="password"
                    className="form-input"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button
                    type="submit"
                    className="login-button"
                    disabled={loading}
                >
                    {loading ? 'LOGGING IN...' : 'LOGIN'}
                </button>
            </form>

            {message && (
                <div className={`message ${messageType}`}>
                    {message.split('\n').map((line, index) => (
                        <div key={index} className={line.includes('🏆') ? 'flag' : ''}>
                            {line}
                        </div>
                    ))}
                </div>
            )}

            <p className="hint">
                <em>Hint: Try SQL injection to login as admin.</em>
            </p>
        </div>
    )
}

export default App
