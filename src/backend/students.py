from flask import Blueprint, request, jsonify, session
from database import get_db
from functools import wraps

student_routes = Blueprint('students', __name__)

# Update the decorator for all routes that should be restricted to admin
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if session.get('role') != 'admin':
            return jsonify({'success': False, 'message': 'Unauthorized'}), 403
        return f(*args, **kwargs)
    return decorated_function

@student_routes.route('/students', methods=['GET'])
@admin_required
def get_students():
    search = request.args.get('search', '')
    fee_status = request.args.get('fee_status', '')
    scholarship_status = request.args.get('scholarship_status', '')
    
    db = get_db()
    query = '''
        SELECT DISTINCT s.StudentId, s.StudentName, s.StudentEmail, s.RollId,
               f.Fees_Status, f.Scholarship_Status
        FROM tblStudent s
        LEFT JOIN tblFee f ON s.StudentId = f.StudentId
        WHERE (s.StudentName LIKE ? OR s.StudentEmail LIKE ? OR s.RollId LIKE ?)
    '''
    params = [f'%{search}%', f'%{search}%', f'%{search}%']

    if fee_status:
        query += ' AND f.Fees_Status = ?'
        params.append(fee_status)
    
    if scholarship_status:
        query += ' AND f.Scholarship_Status = ?'
        params.append(scholarship_status)

    students = db.execute(query, params).fetchall()
    
    return jsonify([dict(student) for student in students])

@student_routes.route('/students', methods=['POST'])
@admin_required
def add_student():
    student_data = request.json
    db = get_db()
    try:
        cursor = db.cursor()
        cursor.execute('''
            INSERT INTO tblStudent (StudentName, RollId, StudentEmail, GENDER, DOB, Address) 
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (student_data['StudentName'], student_data['RollId'], student_data['StudentEmail'], 
              student_data['GENDER'], student_data['DOB'], student_data['Address']))
        db.commit()
        return jsonify({'success': True, 'message': 'Student added successfully', 'StudentId': cursor.lastrowid})
    except Exception as e:
        db.rollback()
        return jsonify({'success': False, 'message': str(e)}), 400

@student_routes.route('/students/<int:student_id>', methods=['GET'])
@admin_required
def get_student(student_id):
    db = get_db()
    student = db.execute('SELECT * FROM tblStudent WHERE StudentId = ?', (student_id,)).fetchone()
    
    if student:
        return jsonify(dict(student))
    else:
        return jsonify({'success': False, 'message': 'Student not found'}), 404

@student_routes.route('/students/<int:student_id>', methods=['PUT'])
@admin_required
def update_student(student_id):
    student_data = request.json
    db = get_db()
    db.execute('''
        UPDATE tblStudent 
        SET StudentName = ?, RollId = ?, StudentEmail = ?, GENDER = ?, DOB = ?, Address = ? 
        WHERE StudentId = ?
    ''', (student_data['StudentName'], student_data['RollId'], student_data['StudentEmail'], 
          student_data['GENDER'], student_data['DOB'], student_data['Address'], student_id))
    db.commit()
    
    return jsonify({'success': True})

@student_routes.route('/students/<int:student_id>', methods=['DELETE'])
@admin_required
def delete_student(student_id):
    db = get_db()
    db.execute('DELETE FROM tblStudent WHERE StudentId = ?', (student_id,))
    db.commit()
    
    return jsonify({'success': True})

@student_routes.route('/students/<int:student_id>/courses', methods=['GET'])
def get_student_courses(student_id):
    db = get_db()
    courses = db.execute('''
        SELECT c.CourseId, c.CourseName, c.CourseCode, c.Section, scr.Status,
               s.SubjectId, s.SubjectName, s.SubjectCode, ssr.Status as SubjectStatus, ssfr.Grade
        FROM tblStudentCourseRegistration scr
        JOIN tblCourse c ON scr.CourseId = c.CourseId
        LEFT JOIN tblStudentSubjectRegistration ssr ON scr.StudentCourseRegistrationId = ssr.StudentCourseRegistrationId
        LEFT JOIN tblCourseSubject cs ON ssr.CourseSubjectId = cs.CourseSubjectId
        LEFT JOIN tblSubject s ON cs.SubjectId = s.SubjectId
        LEFT JOIN tblStudentSubjectFinalResult ssfr ON ssr.StudentSubjectFinalResultId = ssfr.StudentSubjectFinalResultId
        WHERE scr.StudentId = ?
    ''', (student_id,)).fetchall()
    
    result = {}
    for course in courses:
        if course['CourseId'] not in result:
            result[course['CourseId']] = {
                'CourseId': course['CourseId'],
                'CourseName': course['CourseName'],
                'CourseCode': course['CourseCode'],
                'Section': course['Section'],
                'Status': course['Status'],
                'Subjects': []
            }
        if course['SubjectId']:
            result[course['CourseId']]['Subjects'].append({
                'SubjectId': course['SubjectId'],
                'SubjectName': course['SubjectName'],
                'SubjectCode': course['SubjectCode'],
                'Status': course['SubjectStatus'],
                'Grade': course['Grade']
            })
    
    return jsonify(list(result.values()))

@student_routes.route('/students/<int:student_id>/courses/<int:course_id>/register', methods=['POST'])
@admin_required
def register_course(student_id, course_id):
    db = get_db()
    try:
        cursor = db.cursor()
        cursor.execute('''
            INSERT INTO tblStudentCourseRegistration (StudentId, CourseId, Status)
            VALUES (?, ?, 'registered')
        ''', (student_id, course_id))
        db.commit()
        return jsonify({'success': True, 'message': 'Course registered successfully'})
    except Exception as e:
        db.rollback()
        return jsonify({'success': False, 'message': str(e)}), 400

@student_routes.route('/students/<int:student_id>/subjects/<int:subject_id>/register', methods=['POST'])
@admin_required
def register_subject(student_id, subject_id):
    db = get_db()
    try:
        cursor = db.cursor()
        # Get the CourseSubjectId
        course_subject = cursor.execute('''
            SELECT cs.CourseSubjectId, scr.StudentCourseRegistrationId
            FROM tblCourseSubject cs
            JOIN tblStudentCourseRegistration scr ON cs.CourseId = scr.CourseId
            WHERE cs.SubjectId = ? AND scr.StudentId = ?
        ''', (subject_id, student_id)).fetchone()
        
        if not course_subject:
            return jsonify({'success': False, 'message': 'Course or subject not found for this student'}), 404
        
        # Create a new StudentSubjectFinalResult entry
        cursor.execute('INSERT INTO tblStudentSubjectFinalResult (TotalMarksAwarded, MaxTotalMarks) VALUES (0, 0)')
        student_subject_final_result_id = cursor.lastrowid
        
        # Insert into tblStudentSubjectRegistration
        cursor.execute('''
            INSERT INTO tblStudentSubjectRegistration 
            (StudentCourseRegistrationId, CourseSubjectId, StudentSubjectFinalResultId, Status)
            VALUES (?, ?, ?, 'ongoing')
        ''', (course_subject['StudentCourseRegistrationId'], course_subject['CourseSubjectId'], student_subject_final_result_id))
        
        db.commit()
        return jsonify({'success': True, 'message': 'Subject registered successfully'})
    except Exception as e:
        db.rollback()
        return jsonify({'success': False, 'message': str(e)}), 400

@student_routes.route('/students/<int:student_id>/courses/<int:course_id>/drop', methods=['POST'])
@admin_required
def drop_course(student_id, course_id):
    db = get_db()
    db.execute('''
        UPDATE tblStudentCourseRegistration 
        SET Status = 'dropped' 
        WHERE StudentId = ? AND CourseId = ?
    ''', (student_id, course_id))
    db.commit()
    
    return jsonify({'success': True})

@student_routes.route('/students/<int:student_id>/subjects/<int:subject_id>/drop', methods=['POST'])
@admin_required
def drop_subject(student_id, subject_id):
    db = get_db()
    db.execute('''
        UPDATE tblStudentSubjectRegistration 
        SET Status = 'dropped' 
        WHERE StudentCourseRegistrationId = (SELECT StudentCourseRegistrationId FROM tblStudentCourseRegistration WHERE StudentId = ?)
        AND CourseSubjectId = (SELECT CourseSubjectId FROM tblCourseSubject WHERE SubjectId = ?)
    ''', (student_id, subject_id))
    db.commit()
    
    return jsonify({'success': True})

@student_routes.route('/students/<int:student_id>/details', methods=['GET'])
@admin_required
def get_student_details(student_id):
    db = get_db()
    student = db.execute('''
        SELECT s.*, u.Username
        FROM tblStudent s
        LEFT JOIN tblUser u ON s.UserId = u.UserId
        WHERE s.StudentId = ?
    ''', (student_id,)).fetchone()
    
    if not student:
        return jsonify({'success': False, 'message': 'Student not found'}), 404
    
    courses = db.execute('''
        SELECT c.CourseId, c.CourseName, c.CourseCode, c.Section, scr.Status,
               s.SubjectId, s.SubjectName, s.SubjectCode, ssr.Status as SubjectStatus, ssfr.Grade,
               csec.CourseSubjectEvaluationCriteriaId, csec.EvaluationType, csec.MaxMarks,
               sser.MarksAwarded
        FROM tblStudentCourseRegistration scr
        JOIN tblCourse c ON scr.CourseId = c.CourseId
        LEFT JOIN tblStudentSubjectRegistration ssr ON scr.StudentCourseRegistrationId = ssr.StudentCourseRegistrationId
        LEFT JOIN tblCourseSubject cs ON ssr.CourseSubjectId = cs.CourseSubjectId
        LEFT JOIN tblSubject s ON cs.SubjectId = s.SubjectId
        LEFT JOIN tblStudentSubjectFinalResult ssfr ON ssr.StudentSubjectFinalResultId = ssfr.StudentSubjectFinalResultId
        LEFT JOIN tblCourseSubjectEvaluationCriteria csec ON cs.CourseSubjectId = csec.CourseSubjectId
        LEFT JOIN tblStudentSubjectEvaluationResult sser ON csec.CourseSubjectEvaluationCriteriaId = sser.CourseSubjectEvaluationCriteriaId AND ssr.StudentSubjectRegistrationId = sser.StudentSubjectRegistrationId
        WHERE scr.StudentId = ?
    ''', (student_id,)).fetchall()
    
    result = {
        'student': dict(student),
        'courses': {}
    }
    
    for course in courses:
        course_id = course['CourseId']
        if course_id not in result['courses']:
            result['courses'][course_id] = {
                'CourseId': course['CourseId'],
                'CourseName': course['CourseName'],
                'CourseCode': course['CourseCode'],
                'Section': course['Section'],
                'Status': course['Status'],
                'subjects': {}
            }
        if course['SubjectId']:
            subject_id = course['SubjectId']
            if subject_id not in result['courses'][course_id]['subjects']:
                result['courses'][course_id]['subjects'][subject_id] = {
                    'SubjectId': course['SubjectId'],
                    'SubjectName': course['SubjectName'],
                    'SubjectCode': course['SubjectCode'],
                    'Status': course['SubjectStatus'],
                    'Grade': course['Grade'],
                    'EvaluationCriteria': []
                }
            if course['CourseSubjectEvaluationCriteriaId']:
                result['courses'][course_id]['subjects'][subject_id]['EvaluationCriteria'].append({
                    'EvaluationCriteriaId': course['CourseSubjectEvaluationCriteriaId'],
                    'EvaluationType': course['EvaluationType'],
                    'MaxMarks': course['MaxMarks'],
                    'MarksAwarded': course['MarksAwarded']
                })
    
    for course in result['courses'].values():
        course['subjects'] = list(course['subjects'].values())
    
    result['courses'] = list(result['courses'].values())
    return jsonify(result)