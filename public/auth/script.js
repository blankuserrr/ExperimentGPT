function initialize() {
  var isLogin = true;
  $("#toggleButton").click(function () {
    isLogin = !isLogin;
    if (isLogin) {
      $("#toggleButton").text("Sign Up");
      $("#submit").text("Login");
    } else {
      $("#toggleButton").text("Login");
      $("#submit").text("Sign Up");
    }
  });
}

$(document).ready(function () {
  initialize();
});
