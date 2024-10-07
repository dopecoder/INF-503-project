function loadUsers() {
    const userRole = localStorage.getItem('user_role');
    if (userRole !== 'admin') {
        alert('Unauthorized access');
        return;
    }

    $.ajax({
        url: '/users',
        method: 'GET',
        success: function(users) {
            const usersList = $('<ul class="list-group"></ul>');
            users.forEach(function(user) {
                const userItem = $(`
                    <li class="list-group-item">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <strong>${user.Username}</strong> (${user.Role})
                                <br>
                                <small>${user.Email}</small>
                            </div>
                            <div>
                                <button class="btn btn-sm btn-warning reset-password" data-id="${user.UserId}">Reset Password</button>
                                <button class="btn btn-sm btn-danger delete-user" data-id="${user.UserId}">Delete</button>
                            </div>
                        </div>
                    </li>
                `);
                usersList.append(userItem);
            });
            $('#users').html(usersList);

            // Add event listeners for reset password and delete user buttons
            $('.reset-password').click(function() {
                const userId = $(this).data('id');
                resetPassword(userId);
            });

            $('.delete-user').click(function() {
                const userId = $(this).data('id');
                deleteUser(userId);
            });
        },
        error: function() {
            alert('An error occurred while loading users. Please try again.');
        }
    });
}

function resetPassword(userId) {
    const userRole = localStorage.getItem('user_role');
    if (userRole !== 'admin') {
        alert('Unauthorized access');
        return;
    }
    if (confirm('Are you sure you want to reset this user\'s password?')) {
        $.ajax({
            url: `/users/${userId}/reset-password`,
            method: 'POST',
            success: function(response) {
                if (response.success) {
                    alert('Password has been reset successfully.');
                } else {
                    alert('Failed to reset password. Please try again.');
                }
            },
            error: function() {
                alert('An error occurred while resetting the password. Please try again.');
            }
        });
    }
}

function deleteUser(userId) {
    const userRole = localStorage.getItem('user_role');
    if (userRole !== 'admin') {
        alert('Unauthorized access');
        return;
    }
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        $.ajax({
            url: `/users/${userId}`,
            method: 'DELETE',
            success: function(response) {
                if (response.success) {
                    alert('User has been deleted successfully.');
                    loadUsers(); // Reload the users list
                } else {
                    alert('Failed to delete user. Please try again.');
                }
            },
            error: function() {
                alert('An error occurred while deleting the user. Please try again.');
            }
        });
    }
}

// Call loadUsers when the page loads
$(document).ready(function() {
    $('#users-tab').click(function() {
        loadUsers();
    });
});