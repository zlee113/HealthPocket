from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from flask_cors import CORS
import csv
import os

app = Flask(__name__)
# Allow requests from the frontend during development
CORS(app)


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
    return "<h1>Welcome to your dashboard!!! yay!!</h1>"

@app.route("/create_account", methods=["GET", "POST"])
def create_account():
    if request.method == "POST":
        # Get the username and password from the account creation
        new_username = request.form.get("username")
        new_password = request.form.get("password")

        # Write the username and password to a csv
        # TODO: Update with actual user and password requirements,
        # and change csv to be an actual database

        #need to init accounts.csv
        if not os.path.exists("users.csv"):
            with open("users.csv", "w", newline="") as csvfile:
                writer = csv.writer(csvfile)
                writer.writerow(["username","password"])    #header row check
        
        with open("users.csv", "r", newline="") as csvfile:
            reader = csv.reader(csvfile)
            next(reader,None) #skip header check
            for row in reader:
                if (row[0] == new_username):
                    if len(row)>0 and row[0] == new_username:
                        flash("Username already exists")
                        return redirect(url_for("create_account"))

        with open("users.csv", "a", newline="") as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow([new_username, new_password])
        return redirect(url_for("dashboard"))

    return render_template("create_account.html")

if __name__ == '__main__':
    port = int(os.environ.get('PORT', '5001'))
    app.run(host='0.0.0.0', port=port, debug=True)


