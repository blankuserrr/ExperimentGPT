"use strict";

function handleToggleButton(isLogin: boolean, toggleButton: HTMLElement|null, authSubmit: HTMLElement|null){
  if(!toggleButton || !authSubmit) return;
  toggleButton.addEventListener("click", function () {
    isLogin = !isLogin;
    if (isLogin) {
      toggleButton.textContent = "Sign Up";
      authSubmit.textContent = "Login";
    } else {
      toggleButton.textContent = "Login";
      authSubmit.textContent = "Sign Up";
    }
  });
}

function handleAuthForm(authForm: HTMLElement|null, usernameInput: HTMLInputElement, passwordInput: HTMLInputElement, isLogin: boolean){
  if(!authForm) return;
  authForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const username: string = usernameInput.value;
    const password: string = passwordInput.value;

    const url: string = isLogin ? "/login" : "/register";

    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: username, password: password }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        window.location.href = "/"; // Redirect to the homepage on success
      })
      .catch((error) => {
        alert(error.message); // Show the error message returned by the server
      });
  });
}

function loadAuth() {
  let isLogin: boolean = true;
  const toggleButton = document.getElementById("toggleButton");
  const authSubmit = document.getElementById("authSubmit");
  const authForm = document.getElementById("authForm");
  const usernameInput = document.getElementById("username") as HTMLInputElement;
  const passwordInput = document.getElementById("password") as HTMLInputElement;

  handleToggleButton(isLogin, toggleButton, authSubmit);
  handleAuthForm(authForm, usernameInput, passwordInput, isLogin); 
}

window.addEventListener("load", loadAuth);
