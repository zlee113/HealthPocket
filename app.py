from flask import Flask, render_template, request, redirect, url_for, flash

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

if __name__ == "__main__":
    app.run(debug=True)
