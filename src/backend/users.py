from flask import Blueprint, request, jsonify, session
from database import get_db
import hashlib

user_routes = Blueprint('users', __name__)

@user_routes.route('/users', methods=['GET'])
def get_users():
    if session.get('role') != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    search = request.args.get('search', '')
    db = get_db()
    users = db.execute('''
        SELECT UserId, Username, 
        CASE 
            WHEN Role = 'student' THEN (SELECT StudentEmail FROM tblStudent WHERE UserId = tblUser.UserId)
            WHEN Role = 'instructor' THEN (SELECT InstructorEmail FROM tblInstructor WHERE UserId = tblUser.UserId)
            ELSE Username
        END AS Email, 
        Role 
        FROM tblUser 
        WHERE Username LIKE ? OR Email LIKE ?
    ''', (f'%{search}%', f'%{search}%')).fetchall()
    
    return jsonify([dict(user) for user in users])

@user_routes.route('/users/<int:user_id>/reset-password', methods=['POST'])
def reset_password(user_id):
    if session.get('role') != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    new_password = 'defaultpassword'  # You might want to generate a random password
    hashed_password = hashlib.sha1(new_password.encode()).hexdigest()
    
    db = get_db()
    db.execute('UPDATE tblUser SET Password = ? WHERE UserId = ?', (hashed_password, user_id))
    db.commit()
    
    return jsonify({'success': True})

@user_routes.route('/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    if session.get('role') != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    db = get_db()
    db.execute('DELETE FROM tblUser WHERE UserId = ?', (user_id,))
    db.commit()
    
    return jsonify({'success': True})