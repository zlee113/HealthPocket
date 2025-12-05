/*
Dashboard.js  HealthPocket  Virginia Tech   Sprints 2,3
frontend dashboard page. displays 5 tabs: edit medications, insurance plans, 
recommended plans, medication price comparison, my profile
*/

import { useState, useEffect } from "react";
import "./Dashboard.css"; 


//user session
function Dashboard() {
  //sprint 2, brianna
  //username from local storage
  const [username, setUsername] = useState(() => {
    return localStorage.getItem('hp_username') || '';
  });
  //which tab is active on side bar, start at edit meds
  const [activeTab, setActiveTab] = useState("medications");
  
  // sprint 3, youngjoon
  //Income slider states
  const [income, setIncome] = useState(0); // user-selected income (0 = show all)
  const [maxIncome] = useState(79000);    // upper bound for slider

  //sprint 2, brianna
  //clear username and redirect to login page
  const handleSignOut = () => {
    localStorage.removeItem('hp_username'); // clear stored username
    window.location.hash = '#/login';

  };

  //sprint 2,youngjoon
  //logo for insurance companies
  const getLogo = (company) => {
    if (!company) return "/logos/default.svg";
    const name = company.toLowerCase();

    if (name.includes("united")) return "/logos/unitedhealthcare.svg";
    if (name.includes("sentara")) return "/logos/sentara.svg";
    if (name.includes("anthem")) return "/logos/anthem.svg";

    return "/logos/default.svg"; // just incase
  };

  //sprint3, brianna
  //medication 
  const [medMasterList, setMedMasterList] = useState([]); // master medication list
  const [userMeds, setUserMeds] = useState([]);           // user's medications
  const [newMed, setNewMed] = useState("");               // search box
  //price comparison
  const [medPrices, setMedPrices] = useState([]);	  // med prices for each insurance company
  const [insuranceCompanies, setInsuranceCompanies] = useState([]);	  // insuranceDB
  const [medPricesLoaded, setMedPricesLoaded] = useState(false);	  // Prices load when tab
  
  //sprint3, tanish
  //recommendation
  const [recommendedPlans, setRecommendedPlans] = useState([]); //for new sidebar
  const [recommendedLoaded, setRecommendedLoaded] = useState(false);  //for new sidebar
  //$00.00 formatting for display
  const formatPrice = (price) => {
    return typeof price === "number" ? `$${price.toFixed(2)}` : "-";
  };  


  //sprint 2, brianna
  //load username
  useEffect(() => {
    try {
      const stored = localStorage.getItem('hp_username') || '';
      setUsername(stored);
    } catch {
      setUsername('');
    }
  }, []);

  //sprint 2, brianna
  //dashboard connection to server
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

  //sprint 3, brianna
  //get user meds when username changes
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

  //sprint 2, brianna
  //add meds to local user list and post to server
  const handleAddMedication = async (med) => {
    //update 
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

  //sprint2, brianna
  //removes meds on local list and post to backend
  const handleRemoveMedication = async (med) => {
    //update
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

  //sprint 3, tanish
  //price comparison
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

  //sprint2, youngjoon
  //insurance plans
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


  //sprint3, tanish
  //recommended 3 plans from server
  const fetchRecommendedPlans = async () => {
    setRecommendedLoaded(false);
    try {
      const res = await fetch("http://localhost:5001/recommend_insurance", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({username})
      });
      const data = await res.json();
  
      if (data && data.recommendations) {
        setRecommendedPlans(data.recommendations);
      } else {
        setRecommendedPlans([]);
      }
    } catch (err) {
      console.error("Error fetching recommended plans:", err);
      setRecommendedPlans([]);
    }
    setRecommendedLoaded(true);
  };
  
  //sprint3, tanish
  //load this when dashboard loads
  useEffect(() => {
    if (recommendedPlans.length === 0 && username) {
      fetchRecommendedPlans();
    }
  }, [username]);  
  //refresh on edit medications
  useEffect(() => {
    if (activeTab === "profile" && username) {
      fetchRecommendedPlans();
    }
  }, [userMeds]);
  //refresh on edit meds
  useEffect(() => {
    if (username && medPricesLoaded) {
      fetchMedPrices();
    }
  }, [userMeds]);
  
// sprint 3, zach
//Total cost per column for med price comparison table
let totalColumnCost = {
  retail: 0,
};

recommendedPlans.forEach((plan) => {
  totalColumnCost[plan.plan] = 0;
});

medPrices.forEach((med) => {
  // retail total
  totalColumnCost["retail"] += med.retail;

  // each plan total uses its own insurance price
  recommendedPlans.forEach((plan) => {
    const planName = plan.plan;
    const price = med.insuranceRates[planName];

    if (typeof price === "number" && !Number.isNaN(price)) {
      totalColumnCost[planName] += price;
    }
  });
});

// select lowest total cost column for display
let bestOverallColumn = Object.keys(totalColumnCost).reduce((a, b) =>
  totalColumnCost[a] <= totalColumnCost[b] ? a : b
);



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

      {/* Sprint 3, Youngjoon*/}
      {/*Sidebar + main content*/}
      <div className="dashboard-body">
        {/*Sidebar*/}
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
              className={activeTab === "recommended" ? "active" : ""}
              onClick={() => {
                fetchRecommendedPlans();
                setActiveTab("recommended");
              }}
            >
              Recommended Plans
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

        {/*Main content*/}
        <main className="dashboard-main">
          {/*sprint 2, youngjoon*/}
          {/*Insurance Plans*/}
          {activeTab === "insurance" && (
            <div className="insurance-plans">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2>Insurance Plans</h2>
                {/*added nov 7*/}
                {/*Income slider (top-right corner)*/}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <label htmlFor="incomeRange"><strong>Income:</strong></label>
                  <input
                    id="incomeRange"
                    type="range"
                    min="0"
                    max={maxIncome}
                    step="1000"
                    value={income}
                    onChange={(e) => setIncome(Number(e.target.value))}
                    style={{ width: "200px" }}
                  />
                  <span>${income.toLocaleString()}</span>
                </div>
              </div>

              {!insuranceCompanies.length ? (
                <p>Loading insurance plans...</p>
              ) : (
                <div className="plan-container">
                  {insuranceCompanies
                    .filter((plan) => {
                      // Before touching slider: show everything
                      if (income === 0) return true;

                      // Parse numeric premium values
                      const premiumText = plan["Est. Monthly Premiums"] || "0";
                      const numbers = premiumText.match(/\d+(\.\d+)?/g)?.map(Number) || [0];
                      const avgPremium = numbers.reduce((a, b) => a + b, 0) / numbers.length;

                      // Compute monthly income
                      const monthlyIncome = income / 12;

                      // Percentage bands to define "qualifying range"
                      // Low income = 0–4% of monthly income
                      // Mid income = 4–7%
                      // High income = 7–10%
                      // These bands control which premium range each user sees.
                      let lowerBound = 0;
                      let upperBound = 0;

                      if (income < 40000) {             // Low income
                        lowerBound = 0;
                        upperBound = monthlyIncome * 0.04;
                      } else if (income < 80000) {      // Middle income
                        lowerBound = monthlyIncome * 0.04;
                        upperBound = monthlyIncome * 0.07;
                      } else {                          // High income
                        lowerBound = monthlyIncome * 0.07;
                        upperBound = monthlyIncome * 0.12; // up to 12% of monthly income
                      }

                      // Show plan if its avg premium falls inside user's band
                      return avgPremium >= lowerBound && avgPremium <= upperBound;
                    })

                    .map((plan, index) => (
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

                            {/*Drug Coverage*/}
                            {/*added nov 16*/} 
                            <li><strong>Prescription Coverage:</strong></li>
                            {[
                              "Generic Drugs (Tier 1)",
                              "Preferred Brand Drugs (Tier 2)",
                              "Non-Preferred Brand Drugs (Tier 3)",
                              "Specialty Drugs (Tier 4)"
                            ].map((key, idx) => {
                              const value = plan[key];

                              let displayValue;
                              if (value.toLowerCase() === "no") {
                                displayValue = "Not covered";
                              } else if (value === "0") {
                                displayValue = "No charge";
                              } else {
                                displayValue = value;
                              }

                              const label = key
                                .replace("Brand", "")
                                .replace("Drugs", "")
                                .trim();

                              return (
                                <li key={idx} style={{ marginLeft: "1rem" }}>
                                  <strong>{label}:</strong> {displayValue}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* sprint 2, zach */}
          {/* sprint 3,ishani */}
          {activeTab === "med_prices" && (
            <div className="med-price-tab">
              <h2>Medication Price Comparison</h2>
              {medPrices.length === 0 ? (
                <p>No Medications</p>
              ) : (
                <table className="med-price-table">
                <thead>
                  <tr>
                    <th>Medication</th>

                    <th className={bestOverallColumn === "retail" ? "best-header-col" : ""}>
                      Out of Pocket
                      {bestOverallColumn === "retail" && (
                        <span className="best-header-tag">BEST OVERALL</span>
                      )}
                    </th>

                    {recommendedPlans.map((plan, i) => {
                      const planName = plan.plan;
                      return (
                        <th key={i} className={
                          bestOverallColumn === planName ? "best-header-col" : ""
                        }>
                          {planName}
                          {bestOverallColumn === planName && (
                            <span className="best-header-tag">BEST OVERALL</span>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {medPrices.map((med) => {
                    return (
                      <tr key={med.name}>
                        <td className="med-name">{med.name}</td>

                        {/* retail */}
                        <td className={med.best === "retail" ? "best-individual" : ""}>
                          {formatPrice(med.retail)}
                        </td>

                        {recommendedPlans.map((plan, idx) => {
                          const planName = plan.plan;
                          const price = med.insuranceRates[planName];

                          return (
                            <td key={idx}
                                className={med.best === planName ? "best-individual" : ""}>
                              {formatPrice(price)}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                  <tr className="total-row">
                    <td><strong>Total</strong></td>

                    <td className={bestOverallColumn === "retail" ? "best-total" : ""}>
                      {formatPrice(totalColumnCost["retail"])}
                    </td>

                    {recommendedPlans.map((plan, idx) => {
                      const planName = plan.plan;
                      return (
                        <td key={idx} className={bestOverallColumn === planName ? "best-total" : ""}>
                          {formatPrice(totalColumnCost[planName])}
                        </td>
                      );
                    })}
                  </tr>
                  </tbody>

                </table>
              )}
            </div>
          )}

          {/*sprint 3, brianna*/}
          {/*Added nov 26 for new tab*/}
          {activeTab === "recommended" && (
            <div className="recommended-tab">
              <h2>Top Recommended Insurance Plans</h2>
              {!recommendedLoaded ? (
                <p>Loading...</p>
              ) : recommendedPlans.length === 0 ? (
                <p>No recommended plans — add medications first.</p>
              ) : (
                <table className="recommended-nice-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Plan</th>
                      <th>Medication Cost</th>
                      <th>Monthly Premium</th>
                      <th>Total Monthly Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recommendedPlans.map((planObj, idx) => (
                      <tr key={idx}
                          className={idx === 0 ? "best-row" : ""}
                      >
                        <td>{idx + 1}</td>
                        <td className="plan-name">{planObj.plan}</td>
                        <td>{formatPrice(planObj.med_cost)}</td>
                        <td>{formatPrice(planObj.premium)}</td>
                        <td className={idx === 0 ? "best-total-cell" : ""}>
                          {formatPrice(planObj.total_monthly)}
                          {idx === 0 && <span className="best-badge">BEST DEAL</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

              )}
            </div>
          )}



          {/*sprint 3, brianna*/}
          {activeTab === "profile" && (
            <div className="profile-tab">
              <h2>My Profile</h2>
              <div className="profile-card">
                
                <p><strong>Name:</strong> {username}</p>

                <div>
                  <strong>Current Medications:</strong>
                  {userMeds.length === 0 ? (
                    <p>No medications added</p>
                  ) : (
                    <ul>
                      {userMeds.map((med, index) => (
                        <li key={index}>{med}</li>
                      ))}
                    </ul>
                  )}
                </div>
                
                {/*sprint 3, brianna*/}
                {/* v2 */}
                {recommendedPlans.length > 0 ? (
                  <div className="recommended-profile-block">
                    <h3>Recommended Insurance Plan</h3>

                    <p>
                      <strong>Best Plan:</strong> 
                      <span className="best-plan-name"> {recommendedPlans[0].plan}</span>
                    </p>

                    <p><strong>Total Monthly Cost:</strong> {formatPrice(recommendedPlans[0].total_monthly)}</p>

                    <p><strong>Monthly Premium:</strong> {formatPrice(recommendedPlans[0].premium)}</p>

                    <p><strong>Medication Cost:</strong> {formatPrice(recommendedPlans[0].med_cost)}</p>
                  </div>
                ) : (
                  <p><strong>Recommended Plan:</strong> Add your medications to generate a recommendation</p>
                )}

              </div>
            </div>
          )}


          {activeTab === "medications" && (
            <div>
              <h2>Add Your Medications</h2>

              {/*search box on edit*/}
              <div style={{ marginBottom: "1em" }}>
                <input
                  type="text"
                  placeholder="Search for a medication..."
                  value={newMed}
                  onChange={(e) => setNewMed(e.target.value)}
                  style={{ width: "250px", padding: "6px" }}
                />
              </div>

              {/*autocomplete search for meds*/}
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

              {/* User’s meds*/}
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
