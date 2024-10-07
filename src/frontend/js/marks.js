function setupMarksForm() {
    const marksForm = $(`
        <form id="marks-form">
            <div class="form-group">
                <label for="course-select">Select Course</label>
                <select class="form-control" id="course-select" required>
                    <option value="">Select a course</option>
                </select>
            </div>
            <div class="form-group">
                <label for="subject-select">Select Subject</label>
                <select class="form-control" id="subject-select" required>
                    <option value="">Select a subject</option>
                </select>
            </div>
            <div class="form-group">
                <label for="evaluation-type-select">Select Evaluation Type</label>
                <select class="form-control" id="evaluation-type-select" required>
                    <option value="">Select an evaluation type</option>
                </select>
            </div>
            <div id="students-marks-list"></div>
            <button type="submit" class="btn btn-primary">Save Marks</button>
        </form>
    `);
    
    $('#marks').empty().append(marksForm);

    // Load courses
    $.ajax({
        url: '/courses',
        method: 'GET',
        success: function(courses) {
            courses.forEach(function(course) {
                $('#course-select').append(`<option value="${course.CourseId}">${course.CourseName}</option>`);
            });
        },
        error: function() {
            alert('An error occurred while loading courses. Please try again.');
        }
    });

    // Load subjects when a course is selected
    $('#course-select').change(function() {
        const courseId = $(this).val();
        $.ajax({
            url: `/courses/${courseId}/subjects`,
            method: 'GET',
            success: function(subjects) {
                $('#subject-select').empty().append('<option value="">Select a subject</option>');
                subjects.forEach(function(subject) {
                    $('#subject-select').append(`<option value="${subject.SubjectId}">${subject.SubjectName}</option>`);
                });
                // Clear evaluation types and students list when course changes
                $('#evaluation-type-select').empty().append('<option value="">Select an evaluation type</option>');
                $('#students-marks-list').empty();
            },
            error: function() {
                alert('An error occurred while loading subjects. Please try again.');
            }
        });
    });

    // Load evaluation types when a subject is selected
    $('#subject-select').change(function() {
        const subjectId = $(this).val();
        $.ajax({
            url: `/subjects/${subjectId}/evaluation-types`,
            method: 'GET',
            success: function(evaluationTypes) {
                $('#evaluation-type-select').empty().append('<option value="">Select an evaluation type</option>');
                evaluationTypes.forEach(function(et) {
                    $('#evaluation-type-select').append(`<option value="${et.CourseSubjectEvaluationCriteriaId}" data-max-marks="${et.MaxMarks}">${et.EvaluationType} (Max: ${et.MaxMarks})</option>`);
                });
            },
            error: function() {
                alert('An error occurred while loading evaluation types. Please try again.');
            }
        });
    });

    // Load students and existing marks when an evaluation type is selected
    $('#evaluation-type-select').change(function() {
        const subjectId = $('#subject-select').val();
        const evaluationCriteriaId = $(this).val();
        const maxMarks = $('option:selected', this).data('max-marks');
        
        $.when(
            $.ajax({
                url: `/subjects/${subjectId}/students`,
                method: 'GET'
            }),
            $.ajax({
                url: `/marks?evaluationCriteriaId=${evaluationCriteriaId}`,
                method: 'GET'
            })
        ).done(function(studentsResponse, marksResponse) {
            const students = studentsResponse[0];
            const existingMarks = marksResponse[0];
            
            const studentsList = $('<div></div>');
            students.forEach(function(student) {
                const existingMark = existingMarks.find(mark => mark.StudentSubjectRegistrationId === student.StudentSubjectRegistrationId);
                const markValue = existingMark ? existingMark.MarksAwarded : '';
                
                studentsList.append(`
                    <div class="form-group">
                        <label for="marks-${student.StudentSubjectRegistrationId}">${student.StudentName}</label>
                        <input type="number" class="form-control" id="marks-${student.StudentSubjectRegistrationId}" 
                               name="marks[${student.StudentSubjectRegistrationId}]" min="0" max="${maxMarks}" step="0.01" 
                               value="${markValue}" required>
                    </div>
                `);
            });
            $('#students-marks-list').empty().append(studentsList);
        }).fail(function() {
            alert('An error occurred while loading students and marks. Please try again.');
        });
    });

    // Handle form submission
    $('#marks-form').submit(function(e) {
        e.preventDefault();
        const evaluationCriteriaId = $('#evaluation-type-select').val();
        const marks = [];
        $('input[name^="marks"]').each(function() {
            marks.push({
                studentSubjectRegistrationId: $(this).attr('name').match(/\d+/)[0],
                marksAwarded: $(this).val()
            });
        });

        $.ajax({
            url: '/marks',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                evaluationCriteriaId: evaluationCriteriaId,
                marks: marks
            }),
            success: function(response) {
                if (response.success) {
                    alert('Marks saved successfully.');
                } else {
                    alert('Failed to save marks. Please try again.');
                }
            },
            error: function() {
                alert('An error occurred while saving marks. Please try again.');
            }
        });
    });
}

// Call setupMarksForm when the page loads
$(document).ready(function() {
    $('#marks-tab').click(function() {
        setupMarksForm();
    });
});