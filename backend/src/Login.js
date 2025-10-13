import { useState } from 'react';
import './Login.css';
import { useNavigate } from "react-router-dom";

// Renders the small gradient "HP" logo used in the sign-in header
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

// Login form component: handles local validation and calls the backend /login API
function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ username: '', password: '' });

  // Client-side validation for username and password fields 
  function validate() {
    const nextPage = { username: '', password: '' };
    if (!username.trim()) nextPage.username = 'Please enter your username.';
    if (!password.trim()) nextPage.password = 'Please enter your password (min 8 characters).';
    else if (password.length < 8) nextPage.password = 'Password must be at least 8 characters.';
    setErrors(nextPage);
    return nextPage.username === '' && nextPage.password === '';
  }
  /*
  function Home() {
    const navigate = useNavigate();
  
    const handleCreateAccount = () => {
      navigate("/create-account.html");
    };
  
  }
  */
 
  // Handles Submit action: POST credentials to backend and route on to user dashboard on success
  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setErrors({ username: '', password: '' });
    try {
      // Send JSON credentials to the Flask backend
      const res = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      // Get response from backend and try to parse it
      let data;
      try {
        data = await res.json();
      } catch {
        data = { ok: false, message: 'Unexpected server response.' };
      }

      if (!res.ok) {
        if (data && data.code === 'USER_NOT_FOUND') {
          setErrors({ username: 'You need to create an account first.', password: '' });
          return;
        }
        if (data && data.code === 'BAD_CREDENTIALS') {
          setErrors({ username: '', password: 'Username or password is incorrect.' });
          return;
        }
        setErrors({ username: '', password: data?.message || 'Login failed.' });
        return;
      }

      // success
      //dashboard go here
      window.location.href = '/success.html';
    } catch (err) {
      setErrors({ username: '', password: 'Network error. Please try again.' });
    }
  }

  return (
    <main className="container">
      <section className="card" aria-labelledby="signin-title">
        <div className="brandRow">
          <HPLogo />
          <h1 className="brandText">Health Pocket</h1>
        </div>
        <h2 id="signin-title" className="title">Welcome back</h2>
        <p className="subtitle">Sign in to continue to your dashboard.</p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="username" className="label">Username</label>
            <div className="inputWrapper">
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                aria-describedby="usernameError"
                aria-invalid={errors.username ? 'true' : undefined}
                className="input"
              />
            </div>
            {errors.username && (
              <div id="usernameError" role="alert" className="error">{errors.username}</div>
            )}
          </div>

          <div className="field">
            <label htmlFor="password" className="label">Password</label>
            <div className="passwordWrapper">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-describedby="passwordError"
                aria-invalid={errors.password ? 'true' : undefined}
                className="input"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="toggle"
              >{showPassword ? 'Hide' : 'Show'}</button>
            </div>
            {errors.password && (
              <div id="passwordError" role="alert" className="error">{errors.password}</div>
            )}
          </div>

          <div className="rowBetween">
            <label className="checkbox">
              <input type="checkbox" />
              <span>Remember me</span>
            </label>
            <button type="button" className="linkButton" onClick={() => alert('Forgot password clicked (demo)')}>Forgot password?</button>
          </div>

          <button type="submit" className="submit">Sign in</button>
        </form>
        <footer className="footer">
        Don’t have an account?{" "}
        <button
      type="button"
      className="linkButton"
      onClick={() => {
      // Simply navigate to the Flask route that serves create_account.html
      window.location.href = "http://localhost:5001/create_account";
    }}
  >
    Create one
  </button>
</footer>
        </section>
    </main>
  );
}
export default Login;

