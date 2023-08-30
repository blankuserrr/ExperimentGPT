document.getElementById("goToChat").addEventListener("click", function () {
  var url = document.getElementById("chatSelect").value;
  if (url) {
    window.location = url;
  }
});
