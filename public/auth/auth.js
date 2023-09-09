"use strict";
function loadAuth() {
    let isLogin = true;
    const toggleButton = document.getElementById("toggleButton");
    const authSubmit = document.getElementById("authSubmit");
    const authForm = document.getElementById("authForm");
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    if (toggleButton) {
        toggleButton.addEventListener("click", function () {
            isLogin = !isLogin;
            if (authSubmit) {
                if (isLogin) {
                    toggleButton.textContent = "Sign Up";
                    authSubmit.textContent = "Login";
                }
                else {
                    toggleButton.textContent = "Login";
                    authSubmit.textContent = "Sign Up";
                }
            }
        });
    }
    if (authForm) {
        authForm.addEventListener("submit", function (event) {
            event.preventDefault();
            const username = usernameInput.value;
            const password = passwordInput.value;
            const url = isLogin ? "/login" : "/register";
            fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: username, password: password }),
            })
                .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                window.location.href = "/"; // Redirect to the homepage on success
            })
                .catch((error) => {
                alert(error.message); // Show the error message returned by the server
            });
        });
    }
}
window.addEventListener("load", loadAuth);
