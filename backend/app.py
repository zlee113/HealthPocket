"""
app.py  HealthPocket    Virginia Tech   Sprints1,2,3
server for Healthpocket. this server routes to the various pages to be displayed to the user
on the frontend. 
Computes the top 3 recommended insurance plans for a suser based off their specific medications
listed on their profile. Uses user_meds, insuranceDB (insruance plan information), 
and med_master (medication tier/pricing)

"""
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, send_from_directory
from flask_cors import CORS
import csv
import os
import pandas as pd
import re

app = Flask(__name__)
CORS(app)

#sprint 3, brianna
#computes top 3 plans for user 
def compute_recommendations_for_user(username):
    #pull users medications
    with open("user_meds.csv", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        user_meds = [row["medication"] for row in reader if row["username"] == username]

    #no meds case
    if not user_meds:
        return []

    #load out of packet cost and tiers
    med_prices, med_tiers = load_med_data()
    #loads insurance plans 
    df = pd.read_csv("InsuranceDB.csv")
    #for list of totals per plan 
    plan_costs = []

    #go through each plan in insuranceDB
    for _, row in df.iterrows():
        plan_id = f"{row['Insurance Company']} — {row['Plan']}"
        #med cost total under current plan
        med_total_cost = 0

        #for each med user has on their profile
        for med in user_meds:
            #init , testing purposes (see where fail)
            retail = med_prices.get(med, 33)
            tier = med_tiers.get(med, 1)

            #go to corrent column in DB depending on tier, using col name here
            if tier == 1:
                col = "Generic Drugs (Tier 1)"
            elif tier == 2:
                col = "Preferred Brand Drugs (Tier 2)"
            elif tier == 3:
                col = "Non-Preferred Brand Drugs (Tier 3)"
            else:
                col = "Specialty Drugs (Tier 4)"

            val = str(row[col]).strip()
            
            #no coverage, replace coverage with retail price
            if val.lower() == "no":
                insurance_cost = retail
            #precentage based coverage cost
            elif "%" in val:
                pct = float(val.replace("%", "")) / 100
                insurance_cost = pct * retail
            #fixed value coverage cost
            elif "$" in val:
                insurance_cost = float(val.replace("$", "").replace(",", ""))
            #default back to retail
            else:
                insurance_cost = retail
            #total under plan (increment for each med)
            med_total_cost += insurance_cost

        #monthly premium, got rid of ranges in our DB but still works for ranges
        pm = str(row["Est. Monthly Premiums"])
        numbers = re.findall(r"\d+\.?\d*", pm)
        premium = sum(map(float, numbers)) / len(numbers) if numbers else 0

        #save full plan cost obj
        plan_costs.append({
            "plan": plan_id,
            "med_cost": med_total_cost,
            "premium": premium,
            "total_monthly": med_total_cost + premium,
            "total_yearly": (med_total_cost + premium) * 12
        })

    #sort by total monthly, could change to yearly
    plan_costs.sort(key=lambda x: x["total_monthly"])
    #return top 3 plans, not all
    return plan_costs[:3]


#sprint 3, brianna
#loads out of pocket price and tier number
#helper function for compute_recommended_plans
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


#sprint 1, ishani 
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

#sprint 1, ishani
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

#sprint 2, ishani
@app.route("/dashboard")
def dashboard():
    return jsonify({"messgae": "Welcome to dashboard"})

#sprint 1, Zach
#allow new user to create an account 
@app.route("/create_account", methods=["GET", "POST"])
def create_account():
    #user is submitting a new account
    if request.method == "POST":
        new_username = request.form.get("username")
        new_password = request.form.get("password")
        #safety incase users.csv does not exist, create with header row
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

#sprint 2, brianna
@app.route("/medications")
def medications():
    #need username to pull up relevant information per user
    username = request.args.get("user", "")

    # load master list (med_master)
    master_list = []
    with open("med_master.csv", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        master_list = [row["medication"] for row in reader]

    # load user meds
    user_list = []
    with open("user_meds.csv", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        user_list = [row["medication"] for row in reader if row["username"] == username]

    #both lists, masterList for all meds to show on search, userList for 'your meds'
    return jsonify({"masterList": master_list, "userList": user_list})

#sprint 2, brianna
#add a medication to the users profile
@app.route("/add_medication", methods=["POST"])
def add_medication():
    data = request.get_json()
    username = data.get("username")
    med = data.get("medication")

    #search for in med master list
    master_meds = []
    with open("med_master.csv", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        master_meds = [row["medication"] for row in reader]
    #can add med it if need to, not advertised but good functionality for expansion
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
    #good to go!
    return jsonify({"ok": True})


#sprint 2, brianna
@app.route("/remove_medication", methods=["POST"])
def remove_medication():
    data = request.get_json()
    username = data.get("username")
    med = data.get("medication")

    #load all of users meds as list of dictionaries
    with open("user_meds.csv", newline="", encoding="utf-8") as f:
        reader = list(csv.DictReader(f))

    #fins username and med pair to be removed
    updated_rows = [row for row in reader if not (row["username"] == username and row["medication"] == med)]
    #rewrite whole file - the removed user/med pair
    with open("user_meds.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["username", "medication"])
        writer.writeheader()
        writer.writerows(updated_rows)
    #good to go !!!
    return jsonify({"ok": True})

#sprint 3, zach
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


#sprint 2, youngjoon
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
    
#sprint 3, brianna
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


