from flask import Flask, request, jsonify
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


if __name__ == '__main__':
    app.run( debug=True)


