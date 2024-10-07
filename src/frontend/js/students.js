// Remove this function
// function showStudentsTab() { ... }

// Update the document ready function
$(document).ready(function() {
    $('#students-tab').click(function() {
        loadStudents();
    });
});

// Update the loadStudents function:
function loadStudents() {
    const userRole = localStorage.getItem('user_role');
    if (userRole !== 'admin') {
        alert('Unauthorized access');
        return;
    }

    const search = $('#student-search').val() ?? '';
    const feeStatus = $('#fee-status-filter').val() ?? '';
    const scholarshipStatus = $('#scholarship-status-filter').val() ?? '';

    $.ajax({
        url: '/students',
        method: 'GET',
        data: {
            search: search,
            fee_status: feeStatus,
            scholarship_status: scholarshipStatus
        },
        success: function(students) {
            const studentsContent = $('<div></div>');
            
            // Add the "Add Student" button
            const addStudentButton = $(`
                <button class="btn btn-success mb-3" id="add-student">Add Student</button>
            `);
            studentsContent.append(addStudentButton);

            // Add search and filter controls
            const filterControls = $(`
                <div class="mb-3">
                    <input type="text" id="student-search" class="form-control mb-2" placeholder="Search students..." value="${search}">
                    <select id="fee-status-filter" class="form-control mb-2">
                        <option value="">All Fee Statuses</option>
                        <option value="paid" ${feeStatus === 'paid' ? 'selected' : ''}>Paid</option>
                        <option value="pending" ${feeStatus === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="overdue" ${feeStatus === 'overdue' ? 'selected' : ''}>Overdue</option>
                    </select>
                    <select id="scholarship-status-filter" class="form-control mb-2">
                        <option value="">All Scholarship Statuses</option>
                        <option value="paid" ${scholarshipStatus === 'paid' ? 'selected' : ''}>Paid</option>
                        <option value="none" ${scholarshipStatus === 'none' ? 'selected' : ''}>None</option>
                    </select>
                    <div class="d-flex justify-content-between">
                        <button id="apply-filters" class="btn btn-primary">Apply Filters</button>
                        <button id="reset-filters" class="btn btn-secondary">Reset Filters</button>
                    </div>
                </div>
            `);
            studentsContent.append(filterControls);

            const studentsList = $('<ul class="list-group"></ul>');
            students.forEach(function(student) {
                const studentItem = $(`
                    <li class="list-group-item">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <strong>${student.StudentName}</strong>
                                <br>
                                <small>${student.StudentEmail} | ${student.RollId}</small>
                                <br>
                                <small>Fee Status: ${student.Fees_Status || 'N/A'} | Scholarship: ${student.Scholarship_Status || 'N/A'}</small>
                            </div>
                            <div>
                                <button class="btn btn-sm btn-primary edit-student" data-id="${student.StudentId}">Edit</button>
                                <button class="btn btn-sm btn-danger delete-student" data-id="${student.StudentId}">Delete</button>
                            </div>
                        </div>
                    </li>
                `);
                studentsList.append(studentItem);
            });
            studentsContent.append(studentsList);
            $('#students').empty().append(studentsContent);

            // Add event listeners for edit and delete student buttons
            $('.edit-student').click(function() {
                const studentId = $(this).data('id');
                editStudent(studentId);
            });

            $('.delete-student').click(function() {
                const studentId = $(this).data('id');
                deleteStudent(studentId);
            });

            // Add event listener for the "Add Student" button
            $('#add-student').click(function() {
                addStudent();
            });

            // Add event listener for the "Apply Filters" button
            $('#apply-filters').click(function() {
                loadStudents();
            });

            // Add event listener for the "Reset Filters" button
            $('#reset-filters').click(function() {
                $('#student-search').val('');
                $('#fee-status-filter').val('');
                $('#scholarship-status-filter').val('');
                loadStudents();
            });
        },
        error: function(xhr) {
            if (xhr.status === 403) {
                alert('Unauthorized access');
            } else {
                alert('An error occurred while loading students. Please try again.');
            }
        }
    });
}

// Update other functions to check for admin role instead of admin or faculty
function editStudent(studentId) {
    const userRole = localStorage.getItem('user_role');
    if (userRole !== 'admin') {
        alert('Unauthorized access');
        return;
    }
    loadStudentDetails(studentId);
}

function deleteStudent(studentId) {
    const userRole = localStorage.getItem('user_role');
    if (userRole !== 'admin') {
        alert('Unauthorized access');
        return;
    }
    if (confirm('Are you sure you want to delete this student?')) {
        $.ajax({
            url: `/students/${studentId}`,
            method: 'DELETE',
            success: function(response) {
                if (response.success) {
                    alert('Student has been deleted successfully.');
                    loadStudents();
                } else {
                    alert('Failed to delete student. Please try again.');
                }
            },
            error: function() {
                alert('An error occurred while deleting the student. Please try again.');
            }
        });
    }
}

function loadStudentDetails(studentId) {
    const userRole = localStorage.getItem('user_role');
    if (userRole !== 'admin') {
        alert('Unauthorized access');
        return;
    }
    $.ajax({
        url: `/students/${studentId}/details`,
        method: 'GET',
        success: function(response) {
            const student = response.student;
            const courses = response.courses;
            
            const detailsHtml = `
                <h2>Student Details</h2>
                <form id="student-details-form">
                    <div class="form-group">
                        <label for="StudentName">Name</label>
                        <input type="text" class="form-control" id="StudentName" value="${student.StudentName}" required>
                    </div>
                    <div class="form-group">
                        <label for="RollId">Roll ID</label>
                        <input type="text" class="form-control" id="RollId" value="${student.RollId}" required>
                    </div>
                    <div class="form-group">
                        <label for="StudentEmail">Email</label>
                        <input type="email" class="form-control" id="StudentEmail" value="${student.StudentEmail}" required>
                    </div>
                    <div class="form-group">
                        <label for="GENDER">Gender</label>
                        <select class="form-control" id="GENDER" required>
                            <option value="M" ${student.GENDER === 'M' ? 'selected' : ''}>Male</option>
                            <option value="F" ${student.GENDER === 'F' ? 'selected' : ''}>Female</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="DOB">Date of Birth</label>
                        <input type="date" class="form-control" id="DOB" value="${student.DOB}" required>
                    </div>
                    <div class="form-group">
                        <label for="Address">Address</label>
                        <textarea class="form-control" id="Address" required>${student.Address}</textarea>
                    </div>
                    <button type="submit" class="btn btn-primary">Save Changes</button>
                </form>
                
                <h3 class="mt-4">Courses</h3>
                <div id="courses-accordion">
                    ${courses.map((course, index) => `
                        <div class="card">
                            <div class="card-header" id="heading${index}">
                                <h5 class="mb-0">
                                    <button class="btn btn-link" data-toggle="collapse" data-target="#collapse${index}">
                                        ${course.CourseName} (${course.CourseCode}) - ${course.Status}
                                    </button>
                                </h5>
                            </div>
                            <div id="collapse${index}" class="collapse" data-parent="#courses-accordion">
                                <div class="card-body">
                                    <h6>Subjects:</h6>
                                    <ul class="list-group">
                                        ${course.subjects.map(subject => `
                                            <li class="list-group-item">
                                                <div class="d-flex justify-content-between align-items-center">
                                                    <div>
                                                        ${subject.SubjectName} (${subject.SubjectCode})
                                                        <br>
                                                        <small>Status: ${subject.Status} ${subject.Grade ? `| Grade: ${subject.Grade}` : ''}</small>
                                                    </div>
                                                    <div>
                                                        ${subject.Status !== 'completed' && subject.Status !== 'failed' && subject.Status !== 'dropped' ?
                                                            `<button class="btn btn-sm btn-danger ml-2 drop-subject" data-subject-id="${subject.SubjectId}">Drop</button>` : 
                                                            ''
                                                        }
                                                    </div>
                                                </div>
                                                ${subject.EvaluationCriteria && subject.EvaluationCriteria.length > 0 ? `
                                                    <table class="table table-sm mt-2">
                                                        <thead>
                                                            <tr>
                                                                <th>Evaluation Type</th>
                                                                <th>Max Marks</th>
                                                                <th>Marks Awarded</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            ${subject.EvaluationCriteria.map(ec => `
                                                                <tr>
                                                                    <td>${ec.EvaluationType}</td>
                                                                    <td>${ec.MaxMarks}</td>
                                                                    <td>${ec.MarksAwarded || 'N/A'}</td>
                                                                </tr>
                                                            `).join('')}
                                                        </tbody>
                                                    </table>
                                                ` : ''}
                                            </li>
                                        `).join('')}
                                    </ul>
                                    <button class="btn btn-primary mt-3 register-subject" data-course-id="${course.CourseId}">Register for a Subject</button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <button class="btn btn-success mt-3" id="register-course">Register for a Course</button>
            `;
            
            $('#students').html(detailsHtml);
            
            // Add event listeners
            $('#student-details-form').submit(function(e) {
                e.preventDefault();
                updateStudentDetails(studentId);
            });
            
            $('.drop-subject').click(function() {
                const subjectId = $(this).data('subject-id');
                dropSubject(studentId, subjectId);
            });
            
            $('.register-subject').click(function() {
                const courseId = $(this).data('course-id');
                registerSubject(studentId, courseId);
            });
            
            $('#register-course').click(function() {
                registerCourse(studentId);
            });
        },
        error: function() {
            alert('An error occurred while loading student details. Please try again.');
        }
    });
}

function updateStudentDetails(studentId) {
    const userRole = localStorage.getItem('user_role');
    if (userRole !== 'admin') {
        alert('Unauthorized access');
        return;
    }
    const studentData = {
        StudentName: $('#StudentName').val(),
        RollId: $('#RollId').val(),
        StudentEmail: $('#StudentEmail').val(),
        GENDER: $('#GENDER').val(),
        DOB: $('#DOB').val(),
        Address: $('#Address').val()
    };
    
    $.ajax({
        url: `/students/${studentId}`,
        method: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify(studentData),
        success: function(response) {
            if (response.success) {
                alert('Student details updated successfully.');
                loadStudentDetails(studentId);
            } else {
                alert('Failed to update student details. Please try again.');
            }
        },
        error: function() {
            alert('An error occurred while updating student details. Please try again.');
        }
    });
}

function dropSubject(studentId, subjectId) {
    const userRole = localStorage.getItem('user_role');
    if (userRole !== 'admin') {
        alert('Unauthorized access');
        return;
    }
    if (confirm('Are you sure you want to drop this subject?')) {
        $.ajax({
            url: `/students/${studentId}/subjects/${subjectId}/drop`,
            method: 'POST',
            success: function(response) {
                if (response.success) {
                    alert('Subject dropped successfully.');
                    loadStudentDetails(studentId);
                } else {
                    alert('Failed to drop subject. Please try again.');
                }
            },
            error: function() {
                alert('An error occurred while dropping the subject. Please try again.');
            }
        });
    }
}

function registerSubject(studentId, courseId) {
    const userRole = localStorage.getItem('user_role');
    if (userRole !== 'admin') {
        alert('Unauthorized access');
        return;
    }
    $.ajax({
        url: `/courses/${courseId}/subjects`,
        method: 'GET',
        success: function(subjects) {
            const subjectOptions = subjects.map(subject => 
                `<option value="${subject.SubjectId}">${subject.SubjectName}</option>`
            ).join('');
            
            const dialog = $(`
                <div class="modal fade" id="registerSubjectModal" tabindex="-1" role="dialog">
                    <div class="modal-dialog" role="document">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Register for a Subject</h5>
                                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </button>
                            </div>
                            <div class="modal-body">
                                <select class="form-control" id="subject-select">
                                    ${subjectOptions}
                                </select>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                                <button type="button" class="btn btn-primary" id="confirm-register-subject">Register</button>
                            </div>
                        </div>
                    </div>
                </div>
            `);
            
            $('body').append(dialog);
            $('#registerSubjectModal').modal('show');
            
            $('#confirm-register-subject').click(function() {
                const subjectId = $('#subject-select').val();
                $.ajax({
                    url: `/students/${studentId}/subjects/${subjectId}/register`,
                    method: 'POST',
                    success: function(response) {
                        if (response.success) {
                            alert('Subject registered successfully.');
                            $('#registerSubjectModal').modal('hide');
                            loadStudentDetails(studentId);
                        } else {
                            alert('Failed to register subject. Please try again.');
                        }
                    },
                    error: function() {
                        alert('An error occurred while registering the subject. Please try again.');
                    }
                });
            });
        },
        error: function() {
            alert('An error occurred while loading subjects. Please try again.');
        }
    });
}

function registerCourse(studentId) {
    const userRole = localStorage.getItem('user_role');
    if (userRole !== 'admin') {
        alert('Unauthorized access');
        return;
    }
    $.ajax({
        url: '/courses',
        method: 'GET',
        success: function(courses) {
            const courseOptions = courses.map(course => 
                `<option value="${course.CourseId}">${course.CourseName} (${course.CourseCode})</option>`
            ).join('');
            
            const dialog = $(`
                <div class="modal fade" id="registerCourseModal" tabindex="-1" role="dialog">
                    <div class="modal-dialog" role="document">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Register for a Course</h5>
                                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </button>
                            </div>
                            <div class="modal-body">
                                <select class="form-control" id="course-select">
                                    ${courseOptions}
                                </select>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                                <button type="button" class="btn btn-primary" id="confirm-register-course">Register</button>
                            </div>
                        </div>
                    </div>
                </div>
            `);
            
            $('body').append(dialog);
            $('#registerCourseModal').modal('show');
            
            $('#confirm-register-course').click(function() {
                const courseId = $('#course-select').val();
                $.ajax({
                    url: `/students/${studentId}/courses/${courseId}/register`,
                    method: 'POST',
                    success: function(response) {
                        if (response.success) {
                            alert('Course registered successfully.');
                            $('#registerCourseModal').modal('hide');
                            loadStudentDetails(studentId);
                        } else {
                            alert('Failed to register course. Please try again.');
                        }
                    },
                    error: function() {
                        alert('An error occurred while registering the course. Please try again.');
                    }
                });
            });
        },
        error: function() {
            alert('An error occurred while loading courses. Please try again.');
        }
    });
}

// Add the new addStudent function
function addStudent() {
    const userRole = localStorage.getItem('user_role');
    if (userRole !== 'admin') {
        alert('Unauthorized access');
        return;
    }

    const addStudentHtml = `
        <h2>Add New Student</h2>
        <form id="add-student-form">
            <div class="form-group">
                <label for="StudentName">Name</label>
                <input type="text" class="form-control" id="StudentName" required>
            </div>
            <div class="form-group">
                <label for="RollId">Roll ID</label>
                <input type="text" class="form-control" id="RollId" required>
            </div>
            <div class="form-group">
                <label for="StudentEmail">Email</label>
                <input type="email" class="form-control" id="StudentEmail" required>
            </div>
            <div class="form-group">
                <label for="GENDER">Gender</label>
                <select class="form-control" id="GENDER" required>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                </select>
            </div>
            <div class="form-group">
                <label for="DOB">Date of Birth</label>
                <input type="date" class="form-control" id="DOB" required>
            </div>
            <div class="form-group">
                <label for="Address">Address</label>
                <textarea class="form-control" id="Address" required></textarea>
            </div>
            <button type="submit" class="btn btn-primary">Add Student</button>
        </form>
        
        <h3 class="mt-4">Enroll in Course</h3>
        <div class="form-group">
            <label for="course-select">Select Course</label>
            <select class="form-control" id="course-select">
                <option value="">Select a course</option>
            </select>
        </div>
        <button class="btn btn-success mt-2" id="enroll-course">Enroll in Course</button>
        
        <h3 class="mt-4">Enroll in Subject</h3>
        <div class="form-group">
            <label for="subject-select">Select Subject</label>
            <select class="form-control" id="subject-select" disabled>
                <option value="">Select a subject</option>
            </select>
        </div>
        <button class="btn btn-success mt-2" id="enroll-subject" disabled>Enroll in Subject</button>
    `;

    $('#students').html(addStudentHtml);

    // Load courses for enrollment
    $.ajax({
        url: '/courses',
        method: 'GET',
        success: function(courses) {
            courses.forEach(function(course) {
                $('#course-select').append(`<option value="${course.CourseId}">${course.CourseName} (${course.CourseCode})</option>`);
            });
        },
        error: function() {
            alert('An error occurred while loading courses. Please try again.');
        }
    });

    // Handle course selection
    $('#course-select').change(function() {
        const courseId = $(this).val();
        if (courseId) {
            $('#subject-select').prop('disabled', false);
            $('#subject-select').empty().append('<option value="">Select a subject</option>');
            $.ajax({
                url: `/courses/${courseId}/subjects`,
                method: 'GET',
                success: function(subjects) {
                    subjects.forEach(function(subject) {
                        $('#subject-select').append(`<option value="${subject.SubjectId}">${subject.SubjectName}</option>`);
                    });
                },
                error: function() {
                    alert('An error occurred while loading subjects. Please try again.');
                }
            });
        } else {
            $('#subject-select').prop('disabled', true);
            $('#subject-select').empty().append('<option value="">Select a subject</option>');
        }
    });

    // Handle subject selection
    $('#subject-select').change(function() {
        $('#enroll-subject').prop('disabled', !$(this).val());
    });

    // Handle form submission
    $('#add-student-form').submit(function(e) {
        e.preventDefault();
        const studentData = {
            StudentName: $('#StudentName').val(),
            RollId: $('#RollId').val(),
            StudentEmail: $('#StudentEmail').val(),
            GENDER: $('#GENDER').val(),
            DOB: $('#DOB').val(),
            Address: $('#Address').val()
        };

        $.ajax({
            url: '/students',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(studentData),
            success: function(response) {
                if (response.success) {
                    alert('Student added successfully.');
                    loadStudents();
                } else {
                    alert('Failed to add student. Please try again.');
                }
            },
            error: function() {
                alert('An error occurred while adding the student. Please try again.');
            }
        });
    });

    // Handle course enrollment
    $('#enroll-course').click(function() {
        const courseId = $('#course-select').val();
        if (!courseId) {
            alert('Please select a course to enroll.');
            return;
        }

        $.ajax({
            url: `/students/${studentId}/courses/${courseId}/register`,
            method: 'POST',
            success: function(response) {
                if (response.success) {
                    alert('Student enrolled in the course successfully.');
                } else {
                    alert('Failed to enroll student in the course. Please try again.');
                }
            },
            error: function() {
                alert('An error occurred while enrolling the student in the course. Please try again.');
            }
        });
    });

    // Handle subject enrollment
    $('#enroll-subject').click(function() {
        const subjectId = $('#subject-select').val();
        if (!subjectId) {
            alert('Please select a subject to enroll.');
            return;
        }

        $.ajax({
            url: `/students/${studentId}/subjects/${subjectId}/register`,
            method: 'POST',
            success: function(response) {
                if (response.success) {
                    alert('Student enrolled in the subject successfully.');
                } else {
                    alert('Failed to enroll student in the subject. Please try again.');
                }
            },
            error: function() {
                alert('An error occurred while enrolling the student in the subject. Please try again.');
            }
        });
    });
}