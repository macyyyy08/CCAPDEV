function checkLoginForm() {
    var email = document.forms["loginForm"]["email"].value;
    var password = document.forms["loginForm"]["password"].value;

    if (email.trim() === "" || password.trim() === "") {
        alert("Please fill in all fields.");
        return false;
    } else {
        return true;
    } 
}

function checkSignInForm() {
    var name = document.forms["signup-form"]["fullName"].value;
    var email = document.forms["signup-form"]["email"].value;
    var username = document.forms["signup-form"]["username"].value;
    var password = document.forms["signup-form"]["password"].value;
    var confirmPassword = document.forms["signup-form"]["confirmPassword"].value;

    if (name.trim() === "" || email.trim() === "" || username.trim() === "" || password.trim() === "" || confirmPassword.trim() === "") {
        alert("Please fill in all fields.");
        return false;
    } else if (password.trim() !== confirmPassword.trim()) {
        alert("Passwords do not match.");
        return false;
    } else {
        return true; 
    }
}


function checkForgotPasswordForm() {
    var email = document.forms["passwordForm"]["email"].value;
    var username = document.forms["passwordForm"]["username"].value;

    if (email.trim() === "" || username.trim() === "") {
        alert("Please fill in all fields.");
        return false;
    } else {
        return true;
    } 
}