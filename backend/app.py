#app.py
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, send_from_directory
from flask_cors import CORS
import csv
import os
import pandas as pd
import re

app = Flask(__name__)
CORS(app)

def compute_recommendations_for_user(username):
    #pull users medications
    with open("user_meds.csv", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        user_meds = [row["medication"] for row in reader if row["username"] == username]

    if not user_meds:
        return []

    med_prices, med_tiers = load_med_data()
    df = pd.read_csv("InsuranceDB.csv")
    plan_costs = []

    for _, row in df.iterrows():
        plan_id = f"{row['Insurance Company']} — {row['Plan']}"
        med_total_cost = 0

        for med in user_meds:
            retail = med_prices.get(med, 50)
            tier = med_tiers.get(med, 1)

            if tier == 1:
                col = "Generic Drugs (Tier 1)"
            elif tier == 2:
                col = "Preferred Brand Drugs (Tier 2)"
            elif tier == 3:
                col = "Non-Preferred Brand Drugs (Tier 3)"
            else:
                col = "Specialty Drugs (Tier 4)"

            val = str(row[col]).strip()

            if val.lower() == "no":
                insurance_cost = retail
            elif "%" in val:
                pct = float(val.replace("%", "")) / 100
                insurance_cost = pct * retail
            elif "$" in val:
                insurance_cost = float(val.replace("$", "").replace(",", ""))
            else:
                insurance_cost = retail

            med_total_cost += insurance_cost

        pm = str(row["Est. Monthly Premiums"])
        numbers = re.findall(r"\d+\.?\d*", pm)
        premium = sum(map(float, numbers)) / len(numbers) if numbers else 0

        plan_costs.append({
            "plan": plan_id,
            "med_cost": med_total_cost,
            "premium": premium,
            "total_monthly": med_total_cost + premium,
            "total_yearly": (med_total_cost + premium) * 12
        })

    plan_costs.sort(key=lambda x: x["total_monthly"])
    return plan_costs[:3]

def load_med_prices():
    prices = {}
    with open("med_master.csv", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            med = row["medication"]
            try:
                price = float(row["out_of_pocket"])
            except:
                #try this here just incase
                price = 20
            prices[med] = price
    return prices

def load_med_data():
    med_price = {}
    med_tier = {}
    with open("med_master.csv", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            med = row["medication"]
            med_tier[med] = int(row["tier"])
            try:
                med_price[med] = float(row["out_of_pocket"])
            except:
                med_price[med] = 50
    return med_price, med_tier




def read_users_csv(csv_path):
    """Load users from a CSV file with columns 'username' and 'password'.

    Returns a dict mapping username -> password. If the file doesn't exist,
    returns an empty dict to handle the 'no users' case.
    """
    users = {}
    if not os.path.exists(csv_path):
        return users
        
    # Read all rows 
    with open(csv_path, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            username = (row.get('username') or '').strip()
            password = (row.get('password') or '').strip()
            if username:
                users[username] = password
    return users


@app.post('/login')
def login():
    """Authenticates a user by comparing credentials against the CSV 'database'."""
    
    data = request.get_json(silent=True) or {}
    username = (data.get('username') or '').strip()
    password = (data.get('password') or '').strip()

    # Basic input validation to avoid empty credentials reaching the CSV check
    if not username or not password:
        return jsonify({
            'ok': False,
            'code': 'VALIDATION_ERROR',
            'message': 'Username and password are required.'
        }), 400

    # Look up credentials in the CSV located alongside this file
    users_path = os.path.join(os.path.dirname(__file__), 'users.csv')
    users = read_users_csv(users_path)

    # If the username isn't present at all, return an error asking  user to sign up first
    if username not in users:
        return jsonify({
            'ok': False,
            'code': 'USER_NOT_FOUND',
            'message': 'You need to create an account first.'
        }), 404

    # If the username exists but password doesn't match, return an error indicating this
    if users[username] != password:
        return jsonify({
            'ok': False,
            'code': 'BAD_CREDENTIALS',
            'message': 'Username or password is incorrect.'
        }), 401

    # Successful authentication
    return jsonify({'ok': True, 'message': 'User logged in successfully'}), 200

@app.route("/dashboard")
def dashboard():
    return jsonify({"messgae": "Welcome to dashboard"})

@app.route("/create_account", methods=["GET", "POST"])
def create_account():
    if request.method == "POST":
        new_username = request.form.get("username")
        new_password = request.form.get("password")

        if not os.path.exists("users.csv"):
            with open("users.csv", "w", newline="") as csvfile:
                writer = csv.writer(csvfile)
                writer.writerow(["username","password"])

        with open("users.csv", "r", newline="") as csvfile:
            reader = csv.reader(csvfile)
            next(reader,None)
            for row in reader:
                if (row[0] == new_username):
                    flash("Username already exists")
                    return redirect(url_for("create_account"))

        with open("users.csv", "a", newline="", encoding="utf-8") as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow([new_username, new_password])

        #redirect to lgoin
        return redirect("http://localhost:3000/#/login")

    return render_template("create_account.html")

#oct 30
@app.route("/medications")
def medications():
    username = request.args.get("user", "")

    # load master list
    master_list = []
    with open("med_master.csv", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        master_list = [row["medication"] for row in reader]

    # load user meds
    user_list = []
    with open("user_meds.csv", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        user_list = [row["medication"] for row in reader if row["username"] == username]

    return jsonify({"masterList": master_list, "userList": user_list})

@app.route("/add_medication", methods=["POST"])
def add_medication():
    data = request.get_json()
    username = data.get("username")
    med = data.get("medication")

    # Add to master list if not already there
    master_meds = []
    with open("med_master.csv", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        master_meds = [row["medication"] for row in reader]
    if med not in master_meds:
        with open("med_master.csv", "a", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow([med])

    # Add to user meds if not already there
    user_meds = []
    with open("user_meds.csv", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        user_meds = [(row["username"], row["medication"]) for row in reader]

    if (username, med) not in user_meds:
        with open("user_meds.csv", "a", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow([username, med])

    return jsonify({"ok": True})



@app.route("/remove_medication", methods=["POST"])
def remove_medication():
    data = request.get_json()
    username = data.get("username")
    med = data.get("medication")

    # Step 1: Remove from user_meds.csv
    with open("user_meds.csv", newline="", encoding="utf-8") as f:
        reader = list(csv.DictReader(f))

    updated_rows = [row for row in reader if not (row["username"] == username and row["medication"] == med)]

    with open("user_meds.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["username", "medication"])
        writer.writeheader()
        writer.writerows(updated_rows)

    return jsonify({"ok": True})

@app.route("/compare_medications", methods=["POST"])
def compare_medication():
    data = request.get_json()
    username = data.get("username")

    # load user meds
    with open("user_meds.csv", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        user_meds = [row["medication"] for row in reader if row["username"] == username]

    # load med prices & tiers
    med_prices, med_tiers = load_med_data()

    # recommended plans
    recs = compute_recommendations_for_user(username)
    top3_names = [p["plan"] for p in recs]


    df = pd.read_csv("InsuranceDB.csv")
    insurance_lookup = {}
    for _, row in df.iterrows():
        insurance_lookup[f"{row['Insurance Company']} — {row['Plan']}"] = row

    result = []

    for med in user_meds:
        retail = med_prices.get(med, 50)
        tier = med_tiers.get(med, 1)

        entry = {
            "name": med,
            "tier": tier,
            "retail": retail,
            "insuranceRates": {},
            "best": None,
            "best_value": None
        }

        bestCost = retail
        bestMethod = "retail"

        for plan in top3_names:
            row = insurance_lookup.get(plan)

            if tier == 1:
                col = "Generic Drugs (Tier 1)"
            elif tier == 2:
                col = "Preferred Brand Drugs (Tier 2)"
            elif tier == 3:
                col = "Non-Preferred Brand Drugs (Tier 3)"
            else:
                col = "Specialty Drugs (Tier 4)"

            val = str(row[col]).strip()

            if val.lower() == "no":
                insurance_cost = retail
            elif "%" in val:
                pct = float(val.replace("%", "")) / 100
                insurance_cost = pct * retail
            elif "$" in val:
                insurance_cost = float(val.replace("$", "").replace(",", ""))
            else:
                insurance_cost = retail

            entry["insuranceRates"][plan] = insurance_cost

            if insurance_cost < bestCost:
                bestCost = insurance_cost
                bestMethod = plan

        entry["best"] = bestMethod
        entry["best_value"] = bestCost
        result.append(entry)

    return jsonify({
        "medications": result,
        "plans": top3_names
    })


#added nov 2
@app.route("/insurance_plans", methods=["GET"])
def get_insurance_plans():
    try:
        csv_path = os.path.join(os.path.dirname(__file__), "InsuranceDB.csv")
        print("reading csv from:", csv_path)

        # loaf csv
        df = pd.read_csv(csv_path)
        
        plans = df.fillna("").to_dict(orient="records")

        return jsonify(plans)
    except Exception as e:
        print("Error loading insurance plans:", e)
        return jsonify({"error": str(e)}), 500
    
#added nov 26 sprint 3
@app.route("/recommend_insurance", methods=["POST"])
def recommend_insurance():
    data = request.get_json()
    username = data.get("username")
    #put in function to trouble shoot
    recs = compute_recommendations_for_user(username)

    return jsonify({
        "ok": True,
        "recommendations": recs
    })




if __name__ == '__main__':
    port = int(os.environ.get('PORT', '5001'))
    app.run(host='0.0.0.0', port=port, debug=True)


