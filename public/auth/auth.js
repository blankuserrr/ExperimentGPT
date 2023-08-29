function loadJQ() {
  $(document).ready(function () {
    var isLogin = true;
    $("#toggleButton").click(function () {
      isLogin = !isLogin;
      if (isLogin) {
        $("#toggleButton").text("Sign Up");
        $("#authSubmit").text("Login");
      } else {
        $("#toggleButton").text("Login");
        $("#authSubmit").text("Sign Up");
      }
    });

    $("#authForm").on("submit", function (event) {
      event.preventDefault();
      var username = $("#username").val();
      var password = $("#password").val();
      var url = isLogin ? "/login" : "/register";
      $.post(url, { email: username, password: password })
        .done(function () {
          window.location.href = "/"; // Redirect to the homepage on success
        })
        .fail(function (jqXHR) {
          alert(jqXHR.responseText); // Show the error message returned by the server
        });
    });

  });
}

if (window.jQuery) {
  loadJQ();
} else {
  window.addEventListener("load", loadJQ);
}
