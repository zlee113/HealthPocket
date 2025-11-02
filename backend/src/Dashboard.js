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

  //nov 2
  const getLogo = (company) => {
    if (!company) return "/logos/default.svg";
    const name = company.toLowerCase();

    if (name.includes("united")) return "/logos/unitedhealthcare.svg";
    if (name.includes("sentara")) return "/logos/sentara.svg";
    if (name.includes("anthem")) return "/logos/anthem.svg";

    return "/logos/default.svg"; // fallback
  };

  //added 30
  const [medMasterList, setMedMasterList] = useState([]); // master medication list
  const [userMeds, setUserMeds] = useState([]);           // user's medications
  const [newMed, setNewMed] = useState("");               // text input
  const [medPrices, setMedPrices] = useState([]);	  // med prices for each insurance company
  const [insuranceCompanies, setInsuranceCompanies] = useState([]);	  // different insurance companies
  const [medPricesLoaded, setMedPricesLoaded] = useState(false);	  // Prices load when tab
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
  
  const fetchMedPrices = async () => {
    const res = await fetch("/compare_medications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username })
    });
    const data = await res.json();
    setMedPrices(data.medications);
    setMedPricesLoaded(true);  // mark as loaded
  };

  //added nov 2
  useEffect(() => {
    const fetchInsurancePlans = async () => {
      try {
        const res = await fetch("http://localhost:5001/insurance_plans");
        const data = await res.json();
        setInsuranceCompanies(data || []);
      } catch (err) {
        console.error("Error fetching insurance plans:", err);
      }
    };
  
    fetchInsurancePlans();
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
              className={activeTab === "med_prices" ? "active" : ""}
              onClick={() => {
		fetchMedPrices();
		setActiveTab("med_prices");
	      }}
            >
	      Medication Price Comparison
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
          {/*added nov 2*/}
          {/* --- Insurance Plans --- */}
          {activeTab === "insurance" && (
  <div className="insurance-plans">
    <h2>Insurance Plans</h2>
    {!insuranceCompanies.length ? (
      <p>Loading insurance plans...</p>
    ) : (
      <div className="plan-container">
        {insuranceCompanies.map((plan, index) => (
          <div className="plan-card" key={index}>
            <div className="plan-logo">
              <img
                src={process.env.PUBLIC_URL + getLogo(plan["Insurance Company"])}
                alt={plan["Insurance Company"]}
              />
            </div>
            <div className="plan-info">
              <h3 className="plan-title">{plan["Plan"]}</h3>
              <p className="price">{plan["Est. Monthly Premiums"]} per month</p>
              <ul className="plan-details">
                <li><strong>Company:</strong> {plan["Insurance Company"]}</li>
                <li><strong>Coverage Category:</strong> {plan["Coverage Category"]}</li>
                <li><strong>Coinsurance:</strong> {plan["Coinsurance"]}</li>
                <li><strong>Out-of-Pocket Max:</strong> {plan["Out-of-Pocket Max"]}</li>
                <li><strong>Max Benefit:</strong> {plan["Max Benefit"]}</li>
                <li><strong>Prescription Coverage:</strong> {plan["Prescription Coverage"]}</li>
              </ul>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
)}

 

	  {activeTab === "med_prices" && (
	    <div>
	      <h2>Medication Price Comparison</h2>
	      {medPrices.length === 0 ? (
		      <p> No Medications </p>
	      ) : (
	      <table>
		<thead>
                  <tr>
                    <th>Medication</th>
                    <th>Out of Pocket</th>
                    {Object.keys(medPrices[0].insuranceRates).map(company => (
                    <th key={company}>{company}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                {medPrices.map((med) => (
                  <tr key={med.name}>
                  <td>{med.name}</td>
                  <td>${med.outOfPocket.toFixed(2)}</td>
                  {Object.values(med.insuranceRates).map((rate, idx) => (
                  <td key={idx}>${rate.toFixed(2)}</td>
                  ))}
                  </tr>
                  ))}
                 </tbody>
               </table>
	      )}
	    </div>
	  )}
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
