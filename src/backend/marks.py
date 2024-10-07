from flask import Blueprint, request, jsonify, session
from database import get_db

marks_routes = Blueprint('marks', __name__)

@marks_routes.route('/subjects/<int:subject_id>/evaluation-types', methods=['GET'])
def get_evaluation_types(subject_id):
    if session.get('role') not in ['admin', 'faculty', 'instructor']:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    db = get_db()
    evaluation_types = db.execute('''
        SELECT CourseSubjectEvaluationCriteriaId, EvaluationType, MaxMarks
        FROM tblCourseSubjectEvaluationCriteria
        WHERE CourseSubjectId = (SELECT CourseSubjectId FROM tblCourseSubject WHERE SubjectId = ?)
    ''', (subject_id,)).fetchall()
    return jsonify([dict(et) for et in evaluation_types])

@marks_routes.route('/subjects/<int:subject_id>/students', methods=['GET'])
def get_students(subject_id):
    if session.get('role') not in ['admin', 'faculty', 'instructor']:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    db = get_db()
    students = db.execute('''
        SELECT s.StudentId, s.StudentName, ssr.StudentSubjectRegistrationId
        FROM tblStudent s
        JOIN tblStudentCourseRegistration scr ON s.StudentId = scr.StudentId
        JOIN tblStudentSubjectRegistration ssr ON scr.StudentCourseRegistrationId = ssr.StudentCourseRegistrationId
        JOIN tblCourseSubject cs ON ssr.CourseSubjectId = cs.CourseSubjectId
        WHERE cs.SubjectId = ?
    ''', (subject_id,)).fetchall()
    return jsonify([dict(student) for student in students])

@marks_routes.route('/marks', methods=['GET'])
def get_marks():
    if session.get('role') not in ['admin', 'faculty', 'instructor']:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    evaluation_criteria_id = request.args.get('evaluationCriteriaId')
    
    db = get_db()
    marks = db.execute('''
        SELECT StudentSubjectRegistrationId, MarksAwarded
        FROM tblStudentSubjectEvaluationResult
        WHERE CourseSubjectEvaluationCriteriaId = ?
    ''', (evaluation_criteria_id,)).fetchall()
    
    return jsonify([dict(mark) for mark in marks])

@marks_routes.route('/marks', methods=['POST'])
def save_marks():
    if session.get('role') not in ['admin', 'faculty', 'instructor']:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    marks_data = request.json
    db = get_db()
    
    for mark in marks_data['marks']:
        db.execute('''
            INSERT OR REPLACE INTO tblStudentSubjectEvaluationResult 
            (CourseSubjectEvaluationCriteriaId, StudentSubjectRegistrationId, MarksAwarded)
            VALUES (?, ?, ?)
        ''', (marks_data['evaluationCriteriaId'], mark['studentSubjectRegistrationId'], mark['marksAwarded']))
    
    db.commit()
    return jsonify({'success': True})