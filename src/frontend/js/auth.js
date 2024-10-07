function sha1(str) {
    const buffer = new TextEncoder("utf-8").encode(str);
    return crypto.subtle.digest("SHA-1", buffer).then(hash => {
        return Array.from(new Uint8Array(hash))
            .map(b => b.toString(16).padStart(2, "0"))
            .join("");
    });
}

$('#login-form-element').submit(function(e) {
    e.preventDefault();
    const username = $('#username').val();
    const password = $('#password').val();

    sha1(password).then(hashedPassword => {
        $.ajax({
            url: '/login',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ username, password: hashedPassword }),
            xhrFields: {
                withCredentials: true
            },
            success: function(response) {
                if (response.success) {
                    localStorage.setItem('user_role', response.role);
                    showMainContent();
                } else {
                    alert('Login failed. Please try again.');
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.error('Error:', textStatus, errorThrown);
                alert('An error occurred. Please try again.');
            }
        });
    });
});

$('#register-form-element').submit(function(e) {
    e.preventDefault();
    const username = $('#register-username').val();
    const email = $('#email').val();
    const password = $('#register-password').val();

    sha1(password).then(hashedPassword => {
        $.ajax({
            url: '/register',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ username, email, password: hashedPassword }),
            success: function(response) {
                if (response.success) {
                    alert('Registration successful. Please login.');
                    showLoginForm();
                } else {
                    alert('Registration failed. Please try again.');
                }
            },
            error: function() {
                alert('An error occurred. Please try again.');
            }
        });
    });
});

function logout() {
    $.ajax({
        url: '/logout',
        method: 'POST',
        success: function(response) {
            if (response.success) {
                localStorage.removeItem('user_role');
                resetFrontend();
                showLoginForm();
            }
        },
        error: function() {
            alert('An error occurred during logout. Please try again.');
        }
    });
}

function resetFrontend() {
    $('#users-tab, #students-tab, #courses-tab, #marks-tab').hide();
    $('#users, #students, #courses, #marks').empty();
    $('.nav-tabs .nav-link').removeClass('active');
    $('.tab-content .tab-pane').removeClass('active show');
}

// Add these new functions to handle form switching
$('#show-register-form').click(function() {
    $('#login-form').addClass('d-none');
    $('#register-form').removeClass('d-none');
});

$('#show-login-form').click(function() {
    $('#register-form').addClass('d-none');
    $('#login-form').removeClass('d-none');
});

function showLoginForm() {
    $('#login-form').removeClass('d-none');
    $('#register-form').addClass('d-none');
    $('#main-content').addClass('d-none');
}

function showMainContent() {
    $('#login-form').addClass('d-none');
    $('#register-form').addClass('d-none');
    $('#main-content').removeClass('d-none');
    updateTabVisibility();
}