import { useState, useEffect } from "react";
import "./Dashboard.css"; // create a CSS file for styling

function Dashboard() {
  const [username, setUsername] = useState(() => {
    return localStorage.getItem('hp_username') || '';
  });
  const [activeTab, setActiveTab] = useState("medications");

  const handleSignOut = () => {
    localStorage.removeItem('hp_username'); // clear stored username
    window.location.hash = '#/login';

  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem('hp_username') || '';
      setUsername(stored);
    } catch {
      setUsername('');
    }
  }, []);

  return (
    <div className="dashboard-container">
      {/* Top header */}
      <header className="dashboard-header">
        <h1>HealthPocket</h1>
        <div className="header-right">
          <span>Welcome, {username}</span>
          <button onClick={handleSignOut} className="signout-button">
            Sign Out
          </button>
        </div>
      </header>


      {/* Sidebar + main content */}
      <div className="dashboard-body">
        {/* Sidebar */}
        <nav className="dashboard-sidebar">
          <ul>
            <li
              className={activeTab === "medications" ? "active" : ""}
              onClick={() => setActiveTab("medications")}
            >
              Edit Medications
            </li>
            <li
              className={activeTab === "insurance" ? "active" : ""}
              onClick={() => setActiveTab("insurance")}
            >
              Insurance Plans
            </li>
            <li
              className={activeTab === "profile" ? "active" : ""}
              onClick={() => setActiveTab("profile")}
            >
              My Profile
            </li>
          </ul>
        </nav>

        {/* Main content */}
        <main className="dashboard-main">
          {activeTab === "medications" && <h2>Edit Medications</h2>}
          {activeTab === "insurance" && <h2>Insurance Plans</h2>}
          {activeTab === "profile" && <h2>My Profile</h2>}
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
