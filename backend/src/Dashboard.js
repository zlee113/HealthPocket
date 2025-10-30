//dashboard.js

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
  //added 30
  const [medMasterList, setMedMasterList] = useState([]); // master medication list
  const [userMeds, setUserMeds] = useState([]);           // user's medications
  const [newMed, setNewMed] = useState("");               // text input
  //
  useEffect(() => {
    try {
      const stored = localStorage.getItem('hp_username') || '';
      setUsername(stored);
    } catch {
      setUsername('');
    }
  }, []);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch("http://localhost:5001/dashboard");
        const data = await res.json();
        console.log("Flask dashboard data:", data);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      }
    };
    fetchDashboard();
  }, []);

  //30
  useEffect(() => {
    const fetchMeds = async () => {
      try {
        const res = await fetch("http://localhost:5001/medications?user=" + username);
        const data = await res.json();
        setMedMasterList(data.masterList || []);
        setUserMeds(data.userList || []);
      } catch (err) {
        console.error("Error fetching medications:", err);
      }
    };
    fetchMeds();
  }, [username]);
  
  const handleAddMedication = async (med) => {
    // Optimistically update UI
    if (!userMeds.includes(med)) {
      setUserMeds((prev) => [...prev, med]);
    }
  
    try {
      await fetch("http://localhost:5001/add_medication", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, medication: med }),
      });
    } catch (err) {
      console.error("Error adding medication:", err);
    }
  };
  

  const handleRemoveMedication = async (med) => {
    // Optimistically update UI
    setUserMeds(prev => prev.filter(m => m !== med));
  
    try {
      await fetch("http://localhost:5001/remove_medication", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, medication: med }),
      });
    } catch (err) {
      console.error("Error removing medication:", err);
    }
  };
  
  
  

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
          {activeTab === "insurance" && <h2>Insurance Plans</h2>}
          {activeTab === "profile" && <h2>My Profile</h2>}
          {activeTab === "medications" && (
  <div>
    <h2>Add Your Medications</h2>

    {/* --- Search box --- */}
    <div style={{ marginBottom: "1em" }}>
      <input
        type="text"
        placeholder="Search for a medication..."
        value={newMed}
        onChange={(e) => setNewMed(e.target.value)}
        style={{ width: "250px", padding: "6px" }}
      />
    </div>

    {/* --- Search results --- */}
    {newMed.trim() && (
      <div>
        <h4>Search Results:</h4>
        <ul>
          {medMasterList
            .filter((m) =>
              m.toLowerCase().includes(newMed.trim().toLowerCase())
            )
            .map((med, i) => (
              <li key={i}>
                {med}{" "}
                {!userMeds.includes(med) ? (
                  <button
                    onClick={() => handleAddMedication(med)}
                    style={{ marginLeft: "8px" }}
                  >
                    Add
                  </button>
                ) : (
                  <span style={{ color: "gray", marginLeft: "8px" }}>
                    (Already added)
                  </span>
                )}
              </li>
            ))}
        </ul>
      </div>
    )}

    {/* --- User’s meds --- */}
    <h3>Your Medications:</h3>
    <ul>
      {userMeds.map((med, i) => (
        <li key={i}>
          {med}{" "}
          <button
            onClick={() => handleRemoveMedication(med)}
            style={{
              marginLeft: "8px",
              backgroundColor: "#ff4d4d",
              color: "white",
              border: "none",
              padding: "2px 6px",
              borderRadius: "4px",
            }}
          >
            Remove
          </button>
        </li>
      ))}
    </ul>
  </div>
)}





        </main>
      </div>
    </div>
  );
}

export default Dashboard;
