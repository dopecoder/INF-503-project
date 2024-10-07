function loadCourses() {
    $.ajax({
        url: '/courses',
        method: 'GET',
        success: function(courses) {
            const coursesList = $('<div class="accordion" id="coursesAccordion"></div>');
            const userRole = localStorage.getItem('user_role');
            courses.forEach(function(course, index) {
                const courseItem = $(`
                    <div class="card">
                        <div class="card-header" id="heading${index}">
                            <h2 class="mb-0 d-flex justify-content-between align-items-center">
                                <button class="btn btn-link" type="button" data-toggle="collapse" data-target="#collapse${index}" aria-expanded="true" aria-controls="collapse${index}">
                                    ${course.CourseName} (${course.CourseCode}) - Section ${course.Section}
                                </button>
                                ${userRole === 'student' ? `<button class="btn btn-sm btn-primary download-results" data-course-id="${course.CourseId}">Download Results</button>` : ''}
                            </h2>
                        </div>
                        <div id="collapse${index}" class="collapse" aria-labelledby="heading${index}" data-parent="#coursesAccordion">
                            <div class="card-body">
                                <h5>Subjects:</h5>
                                <ul class="list-group">
                                    ${course.Subjects.map(subject => `
                                        <li class="list-group-item">
                                            ${subject.SubjectName} (${subject.SubjectCode})
                                            ${userRole === 'student' ? 
                                                `<br><small>Status: ${subject.Status}, Grade: ${subject.Grade || 'N/A'}</small>
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
                                                 </table>` 
                                                : ''
                                            }
                                        </li>
                                    `).join('')}
                                </ul>
                            </div>
                        </div>
                    </div>
                `);
                coursesList.append(courseItem);
            });
            $('#courses').empty().append(coursesList);

            // Add event listener for download results button
            $('.download-results').click(function() {
                const courseId = $(this).data('course-id');
                downloadResults(courseId);
            });
        },
        error: function() {
            alert('An error occurred while loading courses. Please try again.');
        }
    });
}

function downloadResults(courseId) {
    $.ajax({
        url: `/courses/${courseId}/results`,
        method: 'GET',
        xhrFields: {
            responseType: 'blob'
        },
        success: function(blob) {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `course_${courseId}_results.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        },
        error: function() {
            alert('An error occurred while downloading the results. Please try again.');
        }
    });
}

// Call loadCourses when the page loads
$(document).ready(function() {
    $('#courses-tab').click(function() {
        loadCourses();
    });
});