"""
HealthPocket
Authors: Brianna Rodriguez, Zachary Lee
Date: 10/9/2025

@brief Main file to run the entire application and serve the various url's needed.
@file app.py
"""

from flask import Flask, render_template, request, redirect, url_for, flash
import csv
import os

app = Flask(__name__)
app.secret_key = "supersecretkey"  # needed for flash messages

# hardcode for now use SQL later
VALID_USERNAME = "brianna"
VALID_PASSWORD = "1234"

@app.route("/")
def home():
    return redirect(url_for("login"))

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")

        if username == VALID_USERNAME and password == VALID_PASSWORD:
            return redirect(url_for("dashboard"))
        else:
            flash("Bad username or password")
            return redirect(url_for("login"))

    return render_template("login.html")

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
        if not os.path.exists("accounts.csv"):
            with open("accounts.csv", "w", newline="") as csvfile:
                writer = csv.writer(csvfile)
                writer.writerow(["username","password"])    #header row check
        
        with open("accounts.csv", "r", newline="") as csvfile:
            reader = csv.reader(csvfile)
            next(reader,None) #skip header check
            for row in reader:
                if (row[0] == new_username):
                    if len(row)>0 and row[0] == new_username:
                        flash("Username already exists")
                        return redirect(url_for("create_account"))

        with open("accounts.csv", "a", newline="") as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow([new_username, new_password])
        return redirect(url_for("dashboard"))

    return render_template("create_account.html")
    
if __name__ == "__main__":
    app.run(debug=True)
