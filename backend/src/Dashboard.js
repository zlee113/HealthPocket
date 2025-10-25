import { useEffect, useState } from 'react';
import './Login.css';

function HPLogo() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      role="img"
      aria-label="Health Pocket logo"
      className="hpLogo"
    >
      <defs>
        <linearGradient id="hpGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#60a5fa" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="40" height="40" rx="10" fill="url(#hpGrad)" />
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fill="#ffffff"
        fontWeight="700"
        fontSize="16"
        fontFamily="system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial"
      >
        HP
      </text>
    </svg>
  );
}

function Dashboard() {
  const [username, setUsername] = useState('');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('hp_username') || '';
      setUsername(stored);
    } catch {
      setUsername('');
    }
  }, []);

  function handleSignOut() {
    try {
      localStorage.removeItem('hp_username');
    } catch {}
    window.location.hash = '/login';
  }

  return (
    <main className="container">
      <section className="card" aria-labelledby="dashboard-title">
        <div className="brandRow">
          <HPLogo />
          <h1 className="brandText">Health Pocket</h1>
        </div>

        <h2 id="dashboard-title" className="title">
          {username ? `Welcome, ${username}!` : 'Welcome!'}
        </h2>
        <p className="subtitle">You are now signed in to your dashboard.</p>

        <div className="field">
          <label className="label">User</label>
          <div className="inputWrapper">
            <input
              type="text"
              value={username || 'Unknown user'}
              readOnly
              className="input"
              aria-label="Signed-in username"
            />
          </div>
        </div>

        <div className="rowBetween">
          <button type="button" className="signout" onClick={handleSignOut}>Sign out</button>
        </div>
      </section>
    </main>
  );
}

export default Dashboard;




