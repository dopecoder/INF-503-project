from flask import Blueprint, request, jsonify, session, send_file
from database import get_db
from io import BytesIO
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet

course_routes = Blueprint('courses', __name__)

@course_routes.route('/courses', methods=['GET'])
def get_courses():
    db = get_db()
    user_role = session.get('role')
    user_id = session.get('user_id')
    
    if user_role in ['admin', 'faculty']:
        courses = db.execute('''
            SELECT c.CourseId, c.CourseName, c.CourseCode, c.Section,
                   s.SubjectId, s.SubjectName, s.SubjectCode
            FROM tblCourse c
            LEFT JOIN tblCourseSubject cs ON c.CourseId = cs.CourseId
            LEFT JOIN tblSubject s ON cs.SubjectId = s.SubjectId
            LEFT JOIN tblSemester sem ON cs.SemesterId = sem.SemesterId
            WHERE sem.StartDate <= datetime('now') AND sem.EndDate >= datetime('now')
        ''').fetchall()
    elif user_role == 'instructor':
        instructor = db.execute('SELECT InstructorId FROM tblInstructor WHERE UserId = ?', (user_id,)).fetchone()
        if not instructor:
            return jsonify({'success': False, 'message': 'Instructor not found'}), 404
        instructor_id = instructor['InstructorId']
        courses = db.execute('''
            SELECT c.CourseId, c.CourseName, c.CourseCode, c.Section,
                   s.SubjectId, s.SubjectName, s.SubjectCode
            FROM tblCourse c
            JOIN tblCourseSubject cs ON c.CourseId = cs.CourseId
            JOIN tblSubject s ON cs.SubjectId = s.SubjectId
            JOIN tblSemester sem ON cs.SemesterId = sem.SemesterId
            WHERE cs.InstructorId = ? AND sem.StartDate <= datetime('now') AND sem.EndDate >= datetime('now')
        ''', (instructor_id,)).fetchall()
    elif user_role == 'student':
        student = db.execute('SELECT StudentId FROM tblStudent WHERE UserId = ?', (user_id,)).fetchone()
        if not student:
            return jsonify({'success': False, 'message': 'Student not found'}), 404
        student_id = student['StudentId']
        courses = db.execute('''
            SELECT c.CourseId, c.CourseName, c.CourseCode, c.Section,
                   s.SubjectId, s.SubjectName, s.SubjectCode,
                   ssr.Status, ssfr.Grade,
                   csec.CourseSubjectEvaluationCriteriaId, csec.EvaluationType, csec.MaxMarks,
                   sser.MarksAwarded
            FROM tblStudentCourseRegistration scr
            JOIN tblCourse c ON scr.CourseId = c.CourseId
            JOIN tblStudentSubjectRegistration ssr ON scr.StudentCourseRegistrationId = ssr.StudentCourseRegistrationId
            JOIN tblCourseSubject cs ON ssr.CourseSubjectId = cs.CourseSubjectId
            JOIN tblSubject s ON cs.SubjectId = s.SubjectId
            LEFT JOIN tblStudentSubjectFinalResult ssfr ON ssr.StudentSubjectFinalResultId = ssfr.StudentSubjectFinalResultId
            JOIN tblSemester sem ON cs.SemesterId = sem.SemesterId
            LEFT JOIN tblCourseSubjectEvaluationCriteria csec ON cs.CourseSubjectId = csec.CourseSubjectId
            LEFT JOIN tblStudentSubjectEvaluationResult sser ON csec.CourseSubjectEvaluationCriteriaId = sser.CourseSubjectEvaluationCriteriaId AND ssr.StudentSubjectRegistrationId = sser.StudentSubjectRegistrationId
            WHERE scr.StudentId = ? AND sem.StartDate <= datetime('now') AND sem.EndDate >= datetime('now')
        ''', (student_id,)).fetchall()
    else:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    result = {}
    for course in courses:
        if course['CourseId'] not in result:
            result[course['CourseId']] = {
                'CourseId': course['CourseId'],
                'CourseName': course['CourseName'],
                'CourseCode': course['CourseCode'],
                'Section': course['Section'],
                'Subjects': []
            }
        if course['SubjectId']:
            subject_index = next((index for (index, s) in enumerate(result[course['CourseId']]['Subjects']) if s["SubjectId"] == course['SubjectId']), None)
            if subject_index is None:
                subject = {
                    'SubjectId': course['SubjectId'],
                    'SubjectName': course['SubjectName'],
                    'SubjectCode': course['SubjectCode'],
                    'Status': course['Status'] if user_role == 'student' else None,
                    'Grade': course['Grade'] if user_role == 'student' else None,
                    'EvaluationCriteria': []
                }
                result[course['CourseId']]['Subjects'].append(subject)
                subject_index = len(result[course['CourseId']]['Subjects']) - 1
            
            if user_role == 'student' and course['CourseSubjectEvaluationCriteriaId']:
                result[course['CourseId']]['Subjects'][subject_index]['EvaluationCriteria'].append({
                    'EvaluationCriteriaId': course['CourseSubjectEvaluationCriteriaId'],
                    'EvaluationType': course['EvaluationType'],
                    'MaxMarks': course['MaxMarks'],
                    'MarksAwarded': course['MarksAwarded']
                })
    
    return jsonify(list(result.values()))

@course_routes.route('/courses/<int:course_id>/subjects', methods=['GET'])
def get_subjects(course_id):
    db = get_db()
    user_role = session.get('role')
    user_id = session.get('user_id')

    if user_role in ['admin', 'faculty']:
        subjects = db.execute('''
            SELECT s.SubjectId, s.SubjectName 
            FROM tblSubject s
            JOIN tblCourseSubject cs ON s.SubjectId = cs.SubjectId
            JOIN tblSemester sem ON cs.SemesterId = sem.SemesterId
            WHERE cs.CourseId = ? AND sem.StartDate <= datetime('now') AND sem.EndDate >= datetime('now')
        ''', (course_id,)).fetchall()
    elif user_role == 'instructor':
        instructor = db.execute('SELECT InstructorId FROM tblInstructor WHERE UserId = ?', (user_id,)).fetchone()
        if not instructor:
            return jsonify({'success': False, 'message': 'Instructor not found'}), 404
        instructor_id = instructor['InstructorId']
        subjects = db.execute('''
            SELECT s.SubjectId, s.SubjectName 
            FROM tblSubject s
            JOIN tblCourseSubject cs ON s.SubjectId = cs.SubjectId
            JOIN tblSemester sem ON cs.SemesterId = sem.SemesterId
            WHERE cs.CourseId = ? AND cs.InstructorId = ? AND sem.StartDate <= datetime('now') AND sem.EndDate >= datetime('now')
        ''', (course_id, instructor_id)).fetchall()
    elif user_role == 'student':
        student = db.execute('SELECT StudentId FROM tblStudent WHERE UserId = ?', (user_id,)).fetchone()
        if not student:
            return jsonify({'success': False, 'message': 'Student not found'}), 404
        student_id = student['StudentId']
        subjects = db.execute('''
            SELECT s.SubjectId, s.SubjectName 
            FROM tblSubject s
            JOIN tblCourseSubject cs ON s.SubjectId = cs.SubjectId
            JOIN tblStudentSubjectRegistration ssr ON cs.CourseSubjectId = ssr.CourseSubjectId
            JOIN tblStudentCourseRegistration scr ON ssr.StudentCourseRegistrationId = scr.StudentCourseRegistrationId
            JOIN tblSemester sem ON cs.SemesterId = sem.SemesterId
            WHERE cs.CourseId = ? AND scr.StudentId = ? AND sem.StartDate <= datetime('now') AND sem.EndDate >= datetime('now')
        ''', (course_id, student_id)).fetchall()
    else:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403

    return jsonify([dict(subject) for subject in subjects])

@course_routes.route('/courses/<int:course_id>/results', methods=['GET'])
def get_course_results(course_id):
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403

    db = get_db()
    user_id = session['user_id']
    user_role = session['role']

    if user_role == 'student':
        student = db.execute('SELECT StudentId FROM tblStudent WHERE UserId = ?', (user_id,)).fetchone()
        if not student:
            return jsonify({'success': False, 'message': 'Student not found'}), 404
        student_id = student['StudentId']

        # Fetch course and subject results for the student
        results = db.execute('''
            SELECT c.CourseName, c.CourseCode, s.SubjectName, s.SubjectCode, 
                   ssr.Status, ssfr.Grade, ssfr.TotalMarksAwarded, ssfr.MaxTotalMarks,
                   csec.EvaluationType, csec.MaxMarks, sser.MarksAwarded
            FROM tblStudentCourseRegistration scr
            JOIN tblCourse c ON scr.CourseId = c.CourseId
            JOIN tblStudentSubjectRegistration ssr ON scr.StudentCourseRegistrationId = ssr.StudentCourseRegistrationId
            JOIN tblCourseSubject cs ON ssr.CourseSubjectId = cs.CourseSubjectId
            JOIN tblSubject s ON cs.SubjectId = s.SubjectId
            JOIN tblStudentSubjectFinalResult ssfr ON ssr.StudentSubjectFinalResultId = ssfr.StudentSubjectFinalResultId
            LEFT JOIN tblCourseSubjectEvaluationCriteria csec ON cs.CourseSubjectId = csec.CourseSubjectId
            LEFT JOIN tblStudentSubjectEvaluationResult sser ON csec.CourseSubjectEvaluationCriteriaId = sser.CourseSubjectEvaluationCriteriaId
                AND ssr.StudentSubjectRegistrationId = sser.StudentSubjectRegistrationId
            WHERE scr.StudentId = ? AND c.CourseId = ?
            ORDER BY s.SubjectName, csec.EvaluationType
        ''', (student_id, course_id)).fetchall()

        if not results:
            return jsonify({'success': False, 'message': 'No results found'}), 404

        # Generate PDF
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        elements = []

        styles = getSampleStyleSheet()
        elements.append(Paragraph(f"Course Results: {results[0]['CourseName']} ({results[0]['CourseCode']})", styles['Title']))
        elements.append(Spacer(1, 12))

        data = [['Subject', 'Code', 'Status', 'Grade', 'Total Marks', 'Max Total Marks']]
        current_subject = None
        subject_data = []

        for result in results:
            if current_subject != result['SubjectName']:
                if current_subject:
                    data.append(subject_data)
                    data.append(['Evaluation Criteria', 'Marks Awarded', 'Max Marks', '', '', ''])
                    for criteria in subject_criteria:
                        data.append(criteria)
                    data.append(['', '', '', '', '', ''])  # Empty row for spacing
                
                current_subject = result['SubjectName']
                subject_data = [
                    result['SubjectName'],
                    result['SubjectCode'],
                    result['Status'],
                    result['Grade'] or 'N/A',
                    f"{result['TotalMarksAwarded']:.2f}",
                    f"{result['MaxTotalMarks']:.2f}"
                ]
                subject_criteria = []

            if result['EvaluationType']:
                subject_criteria.append([
                    result['EvaluationType'],
                    f"{result['MarksAwarded']:.2f}" if result['MarksAwarded'] is not None else 'N/A',
                    f"{result['MaxMarks']:.2f}",
                    '', '', ''
                ])

        # Add the last subject
        if subject_data:
            data.append(subject_data)
            data.append(['Evaluation Criteria', 'Marks Awarded', 'Max Marks', '', '', ''])
            for criteria in subject_criteria:
                data.append(criteria)

        table = Table(data)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 14),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 12),
            ('TOPPADDING', (0, 1), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))

        elements.append(table)
        doc.build(elements)

        buffer.seek(0)
        return send_file(buffer, as_attachment=True, download_name=f'course_{course_id}_results.pdf', mimetype='application/pdf')

    else:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403