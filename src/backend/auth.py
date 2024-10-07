from flask import Blueprint, request, jsonify, session
from database import get_db

auth_routes = Blueprint('auth', __name__)

@auth_routes.route('/login', methods=['POST'])
def login():
    username = request.json['username']
    hashed_password = request.json['password']
    
    db = get_db()
    user = db.execute('SELECT * FROM tblUser WHERE Username = ?', (username,)).fetchone()
    
    if user and user['Password'] == hashed_password:
        session['user_id'] = user['UserId']
        session['role'] = user['Role']
        return jsonify({'success': True, 'role': user['Role']})
    else:
        return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

@auth_routes.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True})

@auth_routes.route('/register', methods=['POST'])
def register():
    username = request.json['username']
    email = request.json['email']
    hashed_password = request.json['password']
    
    db = get_db()
    
    # Check if username already exists
    existing_user = db.execute('SELECT * FROM tblUser WHERE Username = ?', (username,)).fetchone()
    if existing_user:
        return jsonify({'success': False, 'message': 'Username already exists'}), 400
    
    # Check if email already exists in tblStudent
    existing_student = db.execute('SELECT * FROM tblStudent WHERE StudentEmail = ?', (email,)).fetchone()
    if existing_student:
        cursor = db.cursor()
        cursor.execute('INSERT INTO tblUser (Username, Password, Role) VALUES (?, ?, ?)', 
                       (username, hashed_password, 'student'))
        new_user_id = cursor.lastrowid
        cursor.execute('UPDATE tblStudent SET UserId = ? WHERE StudentEmail = ?',
                       (new_user_id, email))
        db.commit()
        return jsonify({'success': True})
    else:
        return jsonify({'success': False, 'message': 'Student not found'}), 404

@auth_routes.route('/check-session', methods=['GET'])
def check_session():
    if 'user_id' in session:
        return jsonify({
            'logged_in': True,
            'user_id': session['user_id'],
            'role': session['role']
        })
    else:
        return jsonify({'logged_in': False})