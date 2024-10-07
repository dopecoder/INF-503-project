from flask import Flask, jsonify, request, session, send_from_directory
from flask_cors import CORS
from database import init_db
from auth import auth_routes
from users import user_routes
from students import student_routes
from courses import course_routes
from marks import marks_routes
import os

app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app, supports_credentials=True)
app.secret_key = 'your_secret_key'  # Change this to a secure random key

# Initialize database
# init_db()

# Register blueprints
app.register_blueprint(auth_routes)
app.register_blueprint(user_routes)
app.register_blueprint(student_routes)
app.register_blueprint(course_routes)
app.register_blueprint(marks_routes)

@app.route('/')
def serve_frontend():
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(debug=True, port=8000)  # Change port to 8000