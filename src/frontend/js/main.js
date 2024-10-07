$(document).ready(function() {
    // Check if user is logged in
    $.ajax({
        url: '/check-session',
        method: 'GET',
        success: function(response) {
            if (response.logged_in) {
                localStorage.setItem('user_role', response.role);
                showMainContent();
            } else {
                showLoginForm();
            }
        },
        error: function() {
            showLoginForm();
        }
    });

    // Logout functionality
    $('#logout-link').click(function(e) {
        e.preventDefault();
        logout();
    });
});

function showLoginForm() {
    $('#login-form').removeClass('d-none');
    $('#register-form').addClass('d-none');
    $('#main-content').addClass('d-none');
}

function showRegisterForm() {
    $('#login-form').addClass('d-none');
    $('#register-form').removeClass('d-none');
    $('#main-content').addClass('d-none');
}

function showMainContent() {
    $('#login-form').addClass('d-none');
    $('#register-form').addClass('d-none');
    $('#main-content').removeClass('d-none');
    
    updateTabVisibility();
    
    // Remove this section:
    // Load initial data
    // loadUsers();
    // loadStudents();
    // loadCourses();
    // setupMarksForm();
}

function updateTabVisibility() {
    const userRole = localStorage.getItem('user_role');
    
    // Hide all tabs first
    $('#users-tab, #students-tab, #courses-tab, #marks-tab').hide();
    
    // Show tabs based on user role
    if (userRole === 'admin') {
        $('#users-tab, #students-tab, #courses-tab, #marks-tab').show();
    } else if (userRole === 'instructor') {
        $('#courses-tab, #marks-tab').show();
    } else if (userRole === 'student') {
        $('#courses-tab').show();
    }
    
    // Deactivate all tabs
    $('.nav-tabs .nav-link').removeClass('active');
    $('.tab-content .tab-pane').removeClass('active show');
    
    // Activate the first visible tab
    const firstVisibleTab = $('.nav-tabs .nav-link:visible:first');
    firstVisibleTab.addClass('active');
    $(firstVisibleTab.attr('href')).addClass('active show');
    
    // Load data for the active tab
    const activeTabId = firstVisibleTab.attr('href').substring(1);
    loadTabContent(activeTabId);
}

function loadTabContent(tabId) {
    switch(tabId) {
        case 'users':
            loadUsers();
            break;
        case 'students':
            loadStudents();
            break;
        case 'courses':
            loadCourses();
            break;
        case 'marks':
            setupMarksForm();
            break;
    }
}

// Add event listener for tab changes
$(document).ready(function() {
    $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
        const targetTabId = $(e.target).attr('href').substring(1);
        loadTabContent(targetTabId);
    });
});