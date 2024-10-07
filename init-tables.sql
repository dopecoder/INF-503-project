-- Table for storing grading system to be used
CREATE TABLE tblGradingSystem (
    GradingSystemId INTEGER PRIMARY KEY AUTOINCREMENT,
    Grade TEXT NOT NULL, -- e.g. A, B, C, D, F
    MinMarks REAL NOT NULL,
    MaxMarks REAL NOT NULL,
    CreatedOn TEXT DEFAULT (datetime('now')) NOT NULL,
    UpdatedOn TEXT DEFAULT (datetime('now')) NOT NULL
);

-- Table for storing semester information
CREATE TABLE tblSemester (
    SemesterId INTEGER PRIMARY KEY AUTOINCREMENT,
    SemesterName TEXT NOT NULL, -- e.g. F2024, S2025
    StartDate TEXT NOT NULL,
    EndDate TEXT NOT NULL,
    CreatedOn TEXT DEFAULT (datetime('now')) NOT NULL,
    UpdatedOn TEXT DEFAULT (datetime('now')) NOT NULL
);

-- Table for storing users
CREATE TABLE tblUser (
    UserId INTEGER PRIMARY KEY AUTOINCREMENT,
    Username TEXT NOT NULL,
    Password TEXT NOT NULL, -- Store hashed passwords
    Role TEXT NOT NULL CHECK(Role IN ('admin', 'instructor', 'student')),
    CreatedOn TEXT DEFAULT (datetime('now')) NOT NULL,
    UpdatedOn TEXT DEFAULT (datetime('now')) NOT NULL
);

-- Table for storing student information
CREATE TABLE tblStudent (
    StudentId INTEGER PRIMARY KEY AUTOINCREMENT,
    UserId INT,
    StudentName TEXT NOT NULL,
    RollId TEXT NOT NULL,
    StudentEmail TEXT NOT NULL,
    GENDER CHAR NOT NULL,
    DOB TEXT NOT NULL,
    Address TEXT NOT NULL,
    CreatedOn TEXT DEFAULT (datetime('now')) NOT NULL,
    UpdatedOn TEXT DEFAULT (datetime('now')) NOT NULL,
    CONSTRAINT fk_student_user FOREIGN KEY (UserId) REFERENCES tblUser(UserId) ON DELETE CASCADE,
    CONSTRAINT unique_student_rollid UNIQUE (RollId)
    CONSTRAINT unique_student_email UNIQUE (StudentEmail)
    CONSTRAINT unique_student_user UNIQUE (UserId)
);

-- Table for storing fee details for each student
CREATE TABLE tblFee (
    FeeId INTEGER PRIMARY KEY AUTOINCREMENT,
    StudentId INT NOT NULL,
    SemesterId INT NOT NULL,
    Fees_Status TEXT NOT NULL CHECK(Fees_Status IN ('paid', 'pending', 'overdue')),
    Scholarship_Status TEXT NOT NULL CHECK(Scholarship_Status IN ('paid', 'none')),
    CreatedOn TEXT DEFAULT (datetime('now')) NOT NULL,
    UpdatedOn TEXT DEFAULT (datetime('now')) NOT NULL,
    CONSTRAINT fk_fee_student FOREIGN KEY (StudentId) REFERENCES tblStudent(StudentId) ON DELETE CASCADE,
    CONSTRAINT fk_fee_semester FOREIGN KEY (SemesterId) REFERENCES tblSemester(SemesterId) ON DELETE CASCADE,
    CONSTRAINT unique_student_semester UNIQUE (StudentId, SemesterId)
);

-- Table for storing faculty information
CREATE TABLE tblInstructor (
    InstructorId INTEGER PRIMARY KEY AUTOINCREMENT,
    UserId INT NOT NULL,
    InstructorName TEXT NOT NULL,
    InstructorEmail TEXT NOT NULL,
    InstructorPhone TEXT NOT NULL,
    InstructorAddress TEXT NOT NULL,
    CreatedOn TEXT DEFAULT (datetime('now')) NOT NULL,
    UpdatedOn TEXT DEFAULT (datetime('now')) NOT NULL,
    CONSTRAINT fk_instructor_user FOREIGN KEY (UserId) REFERENCES tblUser(UserId) ON DELETE CASCADE,
    CONSTRAINT unique_instructor_email UNIQUE (InstructorEmail),
    CONSTRAINT unique_instructor_user UNIQUE (UserId)
);

-- Table for storing courses offered by the university
CREATE TABLE tblCourse (
    CourseId INTEGER PRIMARY KEY AUTOINCREMENT,
    CourseName TEXT NOT NULL,
    CourseCode TEXT NOT NULL,
    Section TEXT NOT NULL,
    CreatedOn TEXT DEFAULT (datetime('now')) NOT NULL,
    UpdatedOn TEXT DEFAULT (datetime('now')) NOT NULL
);

-- Table for storing subjects taught for a course
CREATE TABLE tblSubject (
    SubjectId INTEGER PRIMARY KEY AUTOINCREMENT,
    SubjectName TEXT NOT NULL,
    SubjectCode TEXT NOT NULL,
    CreatedOn TEXT DEFAULT (datetime('now')) NOT NULL,
    UpdatedOn TEXT DEFAULT (datetime('now')) NOT NULL
);

-- Table for mapping subjects to courses along with instructor
CREATE TABLE tblCourseSubject (
    CourseSubjectId INTEGER PRIMARY KEY AUTOINCREMENT,
    CourseId INT NOT NULL,
    SubjectId INT NOT NULL,
    SemesterId INT NOT NULL,
    InstructorId INT NOT NULL,
    CreatedOn TEXT DEFAULT (datetime('now')) NOT NULL,
    UpdatedOn TEXT DEFAULT (datetime('now')) NOT NULL,
    CONSTRAINT fk_cs_course FOREIGN KEY (CourseId) REFERENCES tblCourse(CourseId) ON DELETE CASCADE,
    CONSTRAINT fk_cs_subject FOREIGN KEY (SubjectId) REFERENCES tblSubject(SubjectId) ON DELETE CASCADE,
    CONSTRAINT fk_cs_semester FOREIGN KEY (SemesterId) REFERENCES tblSemester(SemesterId) ON DELETE CASCADE,
    CONSTRAINT fk_cs_instructor FOREIGN KEY (InstructorId) REFERENCES tblInstructor(InstructorId) ON DELETE CASCADE,
    CONSTRAINT unique_course_subject UNIQUE (CourseId, SubjectId, SemesterId)
);


-- Table for storing all the different evaluations for a subject
CREATE TABLE tblCourseSubjectEvaluationCriteria (
    CourseSubjectEvaluationCriteriaId INTEGER PRIMARY KEY AUTOINCREMENT,
    CourseSubjectId INT NOT NULL,
    EvaluationType TEXT NOT NULL, -- e.g. quiz, midterm, final
    MaxMarks REAL DEFAULT 100.0 NOT NULL,
    CreatedOn TEXT DEFAULT (datetime('now')) NOT NULL,
    UpdatedOn TEXT DEFAULT (datetime('now')) NOT NULL,
    CONSTRAINT fk_cse_course_subject FOREIGN KEY (CourseSubjectId) REFERENCES tblCourseSubject(CourseSubjectId) ON DELETE CASCADE,
    CONSTRAINT unique_course_subject_evaluation UNIQUE (CourseSubjectId, EvaluationType)
);

-- Table for storing student course registration
CREATE TABLE tblStudentCourseRegistration (
    StudentCourseRegistrationId INTEGER PRIMARY KEY AUTOINCREMENT,
    StudentId INT NOT NULL,
    CourseId INT NOT NULL,
    Status TEXT NOT NULL CHECK(Status IN ('registered', 'completed', 'dropped')),
    CreatedOn TEXT DEFAULT (datetime('now')) NOT NULL,
    UpdatedOn TEXT DEFAULT (datetime('now')) NOT NULL,
    CONSTRAINT fk_scr_student FOREIGN KEY (StudentId) REFERENCES tblStudent(StudentId) ON DELETE CASCADE,
    CONSTRAINT fk_scr_coursesubject FOREIGN KEY (CourseId) REFERENCES tblCourse(CourseId) ON DELETE CASCADE,
    CONSTRAINT unique_student_course UNIQUE (StudentId, CourseId)
);

-- Table for storing student final results for each subject
CREATE TABLE tblStudentSubjectFinalResult (
    StudentSubjectFinalResultId INTEGER PRIMARY KEY AUTOINCREMENT,
    TotalMarksAwarded REAL DEFAULT 0 NOT NULL,
    MaxTotalMarks REAL DEFAULT 0 NOT NULL,
    Grade TEXT,
    CreatedOn TEXT DEFAULT (datetime('now')) NOT NULL,
    UpdatedOn TEXT DEFAULT (datetime('now')) NOT NULL
);

-- Table for storing student subject registration
CREATE TABLE tblStudentSubjectRegistration (
    StudentSubjectRegistrationId INTEGER PRIMARY KEY AUTOINCREMENT,
    StudentCourseRegistrationId INT NOT NULL,
    CourseSubjectId INT NOT NULL,
    StudentSubjectFinalResultId INT NOT NULL,
    Status TEXT NOT NULL CHECK(Status IN ('ongoing', 'completed', 'failed', 'dropped')),
    CreatedOn TEXT DEFAULT (datetime('now')) NOT NULL,
    UpdatedOn TEXT DEFAULT (datetime('now')) NOT NULL,
    CONSTRAINT fk_ssr_student_course FOREIGN KEY (StudentCourseRegistrationId) REFERENCES tblStudentCourseRegistration(StudentCourseRegistrationId) ON DELETE CASCADE,
    CONSTRAINT fk_ssr_course_subject FOREIGN KEY (CourseSubjectId) REFERENCES tblCourseSubject(CourseSubjectId) ON DELETE CASCADE,
    CONSTRAINT fk_ssr_student_subject FOREIGN KEY (StudentSubjectFinalResultId) REFERENCES tblStudentSubjectFinalResult(StudentSubjectFinalResultId) ON DELETE CASCADE,
    CONSTRAINT unique_student_subject_registration UNIQUE (StudentCourseRegistrationId, CourseSubjectId)
);

-- Table for storing student results for each subject evaluation
CREATE TABLE tblStudentSubjectEvaluationResult (
    CourseSubjectEvaluationResultId INTEGER PRIMARY KEY AUTOINCREMENT,
    CourseSubjectEvaluationCriteriaId INT NOT NULL,
    StudentSubjectRegistrationId INT NOT NULL,
    MarksAwarded REAL NOT NULL,
    PostedOn TEXT DEFAULT (datetime('now')) NOT NULL,
    UpdatedOn TEXT DEFAULT (datetime('now')) NOT NULL,
    CONSTRAINT fk_res_cse FOREIGN KEY (CourseSubjectEvaluationCriteriaId) REFERENCES tblCourseSubjectEvaluationCriteria(CourseSubjectEvaluationCriteriaId) ON DELETE CASCADE,
    CONSTRAINT fk_res_scr FOREIGN KEY (StudentSubjectRegistrationId) REFERENCES tblStudentSubjectRegistration(StudentSubjectRegistrationId) ON DELETE CASCADE,
    CONSTRAINT unique_student_evaluation_result UNIQUE (CourseSubjectEvaluationCriteriaId, StudentSubjectRegistrationId)
);

-- Trigger for INSERT operation on tblStudentSubjectEvaluationResult to update tblStudentSubjectFinalResult
CREATE TRIGGER trg_InsertFinalResult
AFTER INSERT ON tblStudentSubjectEvaluationResult
FOR EACH ROW
BEGIN
    -- Update TotalMarksAwarded and MaxTotalMarks in tblStudentSubjectFinalResult
    UPDATE tblStudentSubjectFinalResult
    SET TotalMarksAwarded = TotalMarksAwarded + NEW.MarksAwarded,
        MaxTotalMarks = MaxTotalMarks + (SELECT MaxMarks FROM tblCourseSubjectEvaluationCriteria WHERE CourseSubjectEvaluationCriteriaId = NEW.CourseSubjectEvaluationCriteriaId)
    WHERE StudentSubjectFinalResultId = (SELECT StudentSubjectFinalResultId FROM tblStudentSubjectRegistration WHERE StudentSubjectRegistrationId = NEW.StudentSubjectRegistrationId);

    -- Calculate the grade based on the updated marks
    UPDATE tblStudentSubjectFinalResult
    SET Grade = (
        SELECT Grade
        FROM tblGradingSystem
        WHERE TotalMarksAwarded BETWEEN MinMarks AND MaxMarks
    )
    WHERE StudentSubjectFinalResultId = (SELECT StudentSubjectFinalResultId FROM tblStudentSubjectRegistration WHERE StudentSubjectRegistrationId = NEW.StudentSubjectRegistrationId);
END;

-- Trigger for DELETE operation on tblStudentSubjectEvaluationResult to update tblStudentSubjectFinalResult
CREATE TRIGGER trg_DeleteFinalResult
AFTER DELETE ON tblStudentSubjectEvaluationResult
FOR EACH ROW
BEGIN
    -- Update TotalMarksAwarded and MaxTotalMarks in tblStudentSubjectFinalResult
    UPDATE tblStudentSubjectFinalResult
    SET TotalMarksAwarded = TotalMarksAwarded - OLD.MarksAwarded,
        MaxTotalMarks = MaxTotalMarks - (SELECT MaxMarks FROM tblCourseSubjectEvaluationCriteria WHERE CourseSubjectEvaluationCriteriaId = OLD.CourseSubjectEvaluationCriteriaId)
    WHERE StudentSubjectFinalResultId = (SELECT StudentSubjectFinalResultId FROM tblStudentSubjectRegistration WHERE StudentSubjectRegistrationId = OLD.StudentSubjectRegistrationId);

    -- Calculate the grade based on the updated marks
    UPDATE tblStudentSubjectFinalResult
    SET Grade = (
        SELECT Grade
        FROM tblGradingSystem
        WHERE TotalMarksAwarded BETWEEN MinMarks AND MaxMarks
    )
    WHERE StudentSubjectFinalResultId = (SELECT StudentSubjectFinalResultId FROM tblStudentSubjectRegistration WHERE StudentSubjectRegistrationId = OLD.StudentSubjectRegistrationId);
END;

-- Trigger for INSERT operation on tblStudentSubjectRegistration to manage fees
CREATE TRIGGER trg_ManageFees
AFTER INSERT ON tblStudentSubjectRegistration
FOR EACH ROW
BEGIN
    -- Get the StudentId and SemesterId
    INSERT OR IGNORE INTO tblFee (StudentId, SemesterId, Fees_Status, Scholarship_Status)
    SELECT s.StudentId, cs.SemesterId, 'overdue', 'none'
    FROM tblStudentCourseRegistration scr
    JOIN tblStudent s ON scr.StudentId = s.StudentId
    JOIN tblCourseSubject cs ON NEW.CourseSubjectId = cs.CourseSubjectId
    WHERE scr.StudentCourseRegistrationId = NEW.StudentCourseRegistrationId;

    -- Update existing fee record if scholarship status is 'none'
    UPDATE tblFee
    SET Fees_Status = 'overdue',
        UpdatedOn = datetime('now')
    WHERE StudentId = (
        SELECT s.StudentId
        FROM tblStudentCourseRegistration scr
        JOIN tblStudent s ON scr.StudentId = s.StudentId
        WHERE scr.StudentCourseRegistrationId = NEW.StudentCourseRegistrationId
    )
    AND SemesterId = (
        SELECT cs.SemesterId
        FROM tblCourseSubject cs
        WHERE cs.CourseSubjectId = NEW.CourseSubjectId
    )
    AND Scholarship_Status = 'none';
END;


-- sample data for grading system
INSERT INTO tblGradingSystem (Grade, MinMarks, MaxMarks) VALUES
('A', 90.0, 100.0),
('B', 80.0, 89.9),
('C', 70.0, 79.9),
('D', 60.0, 69.9),
('F', 0.0, 59.9);

INSERT INTO tblSemester (SemesterName, StartDate, EndDate) VALUES
('Fall2023', '2023-08-01', '2023-12-31'),   -- 1
('Spring2024', '2024-01-01', '2024-04-31'), -- 2
('Summer2024', '2024-05-01', '2024-08-31'), -- 3
('Fall2024', '2024-09-01', '2024-12-31'),   -- 4
('Spring2025', '2025-01-01', '2025-04-31'), -- 5
('Summer2025', '2025-05-01', '2025-08-31'), -- 6
('Fall2025', '2025-09-01', '2025-12-31'),   -- 7
('Spring2026', '2026-01-01', '2026-04-31'), -- 8
('Summer2026', '2026-05-01', '2026-08-31'), -- 9
('Fall2026', '2026-09-01', '2026-12-31');   -- 10

INSERT INTO tblUser (Username, Password, Role) VALUES
('instructor1', 'eabda97c2b5b00b343da04115b15ac2c8ee14101', 'instructor'), -- 1, password: instructor1pass
('instructor2', 'fc03efc7a083437e18a8dc0bda72e4d8592ae260', 'instructor'), -- 2
('instructor3', '5918e1064ce7f786deba2b30cadbee3ba2069786', 'instructor'), -- 3
('instructor4', '0a3242c55016da7c8847596930acf040b6d8e659', 'instructor'), -- 4
('instructor5', '50c6bd9864e43e57f138ca2cb9e48e505f9aa52d', 'instructor'), -- 5
('instructor6', '2f4156978e659ab79317093c4ec1565626386ad5', 'instructor'), -- 6
('instructor7', 'f3461a67fb2a50b854dbbed69a3a708d28134998', 'instructor'), -- 7
('instructor8', 'c9e51662445fa183442b9c05a89810971fe308a6', 'instructor'), -- 8
('instructor9', '963cdd4bd6c628699f8ea85d2d747606c90782cc', 'instructor'), -- 9
('instructor10', '9a9fceeb55ae790e32281b57cb4e9a5815990311', 'instructor'), -- 10
('admin1', '5b6972206715b58f98e136cd84356d9ff0720b59', 'admin'); -- 11

INSERT INTO tblInstructor (UserId, InstructorName, InstructorEmail, InstructorPhone, InstructorAddress) VALUES
(1, 'Instructor 1', 'instructor1@my.trine.edu', '123-456-7890', '123 Maple Street'), -- 1
(2, 'Instructor 2', 'instructor2@my.trine.edu', '123-456-7891', '456 Oak Avenue'), -- 2
(3, 'Instructor 3', 'instructor3@my.trine.edu', '123-456-7892', '789 Pine Road'), -- 3
(4, 'Instructor 4', 'instructor4@my.trine.edu', '123-456-7893', '234 Maple Street'), -- 4
(5, 'Instructor 5', 'instructor5@my.trine.edu', '123-456-7894', '567 Oak Avenue'), -- 5
(6, 'Instructor 6', 'instructor6@my.trine.edu', '123-456-7895', '890 Pine Road'), -- 6
(7, 'Instructor 7', 'instructor7@my.trine.edu', '123-456-7896', '345 Maple Street'), -- 7
(8, 'Instructor 8', 'instructor8@my.trine.edu', '123-456-7897', '678 Oak Avenue'), -- 8
(9, 'Instructor 9', 'instructor9@my.trine.edu', '123-456-7898', '901 Pine Road'), -- 9
(10, 'Instructor 10', 'instructor10@my.trine.edu', '123-456-7899', '345 Maple Street'); -- 10

-- sample data for MSIS course
INSERT INTO tblCourse (CourseName, CourseCode, Section) VALUES
('Masters in Information Science', 'MSIS', 'A');
INSERT INTO tblSubject (SubjectName, SubjectCode) VALUES
('Statistics & Quantitative Methods', 'BA 6933'),
('Project Management', 'GE 5103'),
('Advanced Database', 'INF 503'),
('Object-Oriented Programming in Java', 'IS 5103'),
('Network Management', 'IS 5203'),
('Data Science & Big Data', 'IS 5213'),
('Cybersecurity', 'IS 5403'),
('Cloud Computing', 'IS 5503'),
('Systems Engineering Analysis', 'SYS 5013'),
('Information Studies Capstone', 'IS 5803');
INSERT INTO tblCourseSubject (CourseId, SubjectId, SemesterId, InstructorId) VALUES
(1, 1, 4, 1),
(1, 2, 4, 2),
(1, 3, 4, 3),
(1, 4, 4, 4),
(1, 5, 4, 5),
(1, 6, 4, 6),
(1, 7, 4, 7),
(1, 8, 4, 8),
(1, 9, 4, 9),
(1, 10, 4, 10),
(1, 1, 5, 1),
(1, 2, 5, 2),
(1, 3, 5, 3),
(1, 4, 5, 4),
(1, 5, 5, 5),
(1, 6, 5, 6),
(1, 7, 5, 7),
(1, 8, 5, 8),
(1, 9, 5, 9),
(1, 10, 5, 10);
INSERT INTO tblCourseSubjectEvaluationCriteria (CourseSubjectId, EvaluationType, MaxMarks) VALUES
(1, 'quiz', 20.0),
(1, 'midterm', 30.0),
(1, 'final', 50.0),
(2, 'quiz', 20.0),
(2, 'midterm', 30.0),
(2, 'final', 50.0),
(3, 'quiz', 20.0),
(3, 'midterm', 30.0),
(3, 'final', 50.0),
(4, 'quiz', 20.0),
(4, 'midterm', 30.0),
(4, 'final', 50.0),
(5, 'quiz', 20.0),
(5, 'midterm', 30.0),
(5, 'final', 50.0),
(6, 'quiz', 20.0),
(6, 'midterm', 30.0),
(6, 'final', 50.0),
(7, 'quiz', 20.0),
(7, 'midterm', 30.0),
(7, 'final', 50.0),
(8, 'quiz', 20.0),
(8, 'midterm', 30.0),
(8, 'final', 50.0),
(9, 'quiz', 20.0),
(9, 'midterm', 30.0),
(9, 'final', 50.0),
(10, 'quiz', 20.0),
(10, 'midterm', 30.0),
(10, 'final', 50.0),
(11, 'quiz', 20.0),
(11, 'midterm', 30.0),
(11, 'final', 50.0),
(12, 'quiz', 20.0),
(12, 'midterm', 30.0),
(12, 'final', 50.0),
(13, 'quiz', 20.0),
(13, 'midterm', 30.0),
(13, 'final', 50.0),
(14, 'quiz', 20.0),
(14, 'midterm', 30.0),
(14, 'final', 50.0),
(15, 'quiz', 20.0),
(15, 'midterm', 30.0),
(15, 'final', 50.0),
(16, 'quiz', 20.0),
(16, 'midterm', 30.0),
(16, 'final', 50.0),
(17, 'quiz', 20.0),
(17, 'midterm', 30.0),
(17, 'final', 50.0),
(18, 'quiz', 20.0),
(18, 'midterm', 30.0),
(18, 'final', 50.0),
(19, 'quiz', 20.0),
(19, 'midterm', 30.0),
(19, 'final', 50.0),
(20, 'quiz', 20.0),
(20, 'midterm', 30.0),
(20, 'final', 50.0);

-- sample data for MSBA course
INSERT INTO tblCourse (CourseName, CourseCode, Section) VALUES
('Masters in Business Analytics', 'MSIS', 'B');
INSERT INTO tblSubject (SubjectName, SubjectCode) VALUES
('Operations Analytics', 'BAN 5003'),
('Analytics Software & Tools', 'BAN 5013'),
('Data Mining & Data Visualization', 'IS 5113'),
('Data Science & Big Data', 'IS 5213'),
('Corporate Finance', 'FIN 5063'),
('Financial Modeling', 'FIN 5823'),
('Data Driven Decision-Making', 'BAN 5023'),
('Business Analytics Capstone', 'BAN 6093');
INSERT INTO tblCourseSubject (CourseId, SubjectId, SemesterId, InstructorId) VALUES
(2, 1, 4, 1),
(2, 2, 4, 2),
(2, 11, 4, 3),
(2, 12, 4, 4),
(2, 13, 4, 5),
(2, 14, 4, 6),
(2, 15, 4, 7),
(2, 16, 4, 8),
(2, 17, 4, 9),
(2, 18, 4, 10),
(2, 1, 5, 1),
(2, 2, 5, 2),
(2, 11, 5, 3),
(2, 12, 5, 4),
(2, 13, 5, 5),
(2, 14, 5, 6),
(2, 15, 5, 7),
(2, 16, 5, 8),
(2, 17, 5, 9),
(2, 18, 5, 10);
INSERT INTO tblCourseSubjectEvaluationCriteria (CourseSubjectId, EvaluationType, MaxMarks) VALUES
(21, 'quiz', 20.0),
(21, 'midterm', 30.0),
(21, 'final', 50.0),
(22, 'quiz', 20.0),
(22, 'midterm', 30.0),
(22, 'final', 50.0),
(23, 'quiz', 20.0),
(23, 'midterm', 30.0),
(23, 'final', 50.0),
(24, 'quiz', 20.0),
(24, 'midterm', 30.0),
(24, 'final', 50.0),
(25, 'quiz', 20.0),
(25, 'midterm', 30.0),
(25, 'final', 50.0),
(26, 'quiz', 20.0),
(26, 'midterm', 30.0),
(26, 'final', 50.0),
(27, 'quiz', 20.0),
(27, 'midterm', 30.0),
(27, 'final', 50.0),
(28, 'quiz', 20.0),
(28, 'midterm', 30.0),
(28, 'final', 50.0),
(29, 'quiz', 20.0),
(29, 'midterm', 30.0),
(29, 'final', 50.0),
(30, 'quiz', 20.0),
(30, 'midterm', 30.0),
(30, 'final', 50.0),
(31, 'quiz', 20.0),
(31, 'midterm', 30.0),
(31, 'final', 50.0),
(32, 'quiz', 20.0),
(32, 'midterm', 30.0),
(32, 'final', 50.0),
(33, 'quiz', 20.0),
(33, 'midterm', 30.0),
(33, 'final', 50.0),
(34, 'quiz', 20.0),
(34, 'midterm', 30.0),
(34, 'final', 50.0),
(35, 'quiz', 20.0),
(35, 'midterm', 30.0),
(35, 'final', 50.0),
(36, 'quiz', 20.0),
(36, 'midterm', 30.0),
(36, 'final', 50.0),
(37, 'quiz', 20.0),
(37, 'midterm', 30.0),
(37, 'final', 50.0),
(38, 'quiz', 20.0),
(38, 'midterm', 30.0),
(38, 'final', 50.0);

-- Sample data for tblStudent
INSERT INTO tblUser (Username, Password, Role) VALUES
('student1', 'e7a5d3d4f48d77fff3797a72a67ecbc1c0971484', 'student'),
('student2', 'dfab54400a2247a1044984a76107d1af7ba7e0cd', 'student'),
('student3', 'a52a852f6b29d2679781602955468463cc897a9e', 'student'),
('student4', 'f958b2109ca4a8f62fe42e44846f3503e7cea3b8', 'student'),
('student5', '36fc15a80b0f187dc588f555f384dd8b0a47547b', 'student');
INSERT INTO tblStudent (UserId, StudentName, RollId, StudentEmail, GENDER, DOB, Address) VALUES
(12, 'Student 1', 'ROLL1', 'student1@my.trine.edu', 'M', '1998-05-21', '123 Maple Street'),
(13, 'Student 2', 'ROLL2', 'student2@my.trine.edu', 'F', '1999-06-22', '456 Oak Avenue'),
(14, 'Student 3', 'ROLL3', 'student3@my.trine.edu', 'M', '2000-07-23', '789 Pine Road'),
(15, 'Student 4', 'ROLL4', 'student4@my.trine.edu', 'F', '2001-08-24', '234 Maple Street'),
(16, 'Student 5', 'ROLL5', 'student5@my.trine.edu', 'M', '2001-08-25', '345 Maple Street');
INSERT INTO tblStudent (StudentName, RollId, StudentEmail, GENDER, DOB, Address) VALUES
('Student 6', 'ROLL6', 'student6@my.trine.edu', 'M', '2001-08-26', '456 Maple Street'); -- student without user
INSERT INTO tblStudentCourseRegistration (StudentId, CourseId, Status) VALUES
(1, 1, 'registered'),
(2, 1, 'registered'),
(3, 2, 'registered'),
(4, 2, 'registered'),
(5, 1, 'registered');
INSERT INTO tblStudentSubjectFinalResult (TotalMarksAwarded, MaxTotalMarks) VALUES
(0, 0),
(0, 0),
(0, 0),
(0, 0),
(0, 0),
(0, 0),
(0, 0),
(0, 0),
(0, 0),
(0, 0);
INSERT INTO tblStudentSubjectRegistration (StudentCourseRegistrationId, CourseSubjectId, StudentSubjectFinalResultId, Status) VALUES
(1, 1, 1, 'ongoing'),
(1, 2, 2, 'ongoing'),
(2, 1, 3, 'ongoing'),
(2, 2, 4, 'ongoing'),
(3, 23, 5, 'ongoing'),
(3, 24, 6, 'ongoing'),
(4, 23, 7, 'ongoing'),
(4, 24, 8, 'ongoing'),
(5, 1, 9, 'ongoing'),
(5, 2, 10, 'ongoing');
INSERT INTO tblStudentSubjectEvaluationResult (CourseSubjectEvaluationCriteriaId, StudentSubjectRegistrationId, MarksAwarded) VALUES
(1, 1, 18.0),
(2, 1, 25.0),
(3, 1, 45.0),
(4, 2, 15.0),
(1, 3, 15.0),
(2, 3, 20.0),
(3, 3, 35.0),
(4, 4, 16.0),
(67, 5, 18.0),
(68, 5, 25.0),
(69, 5, 45.0),
(70, 6, 12.0),
(67, 7, 15.0),
(68, 7, 20.0),
(69, 7, 35.0),
(70, 8, 14.0);
