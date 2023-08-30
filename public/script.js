document.body.addEventListener("htmx:beforeRequest", function (evt) {
  if (evt.detail.elt.id === "chatForm") {
    var userMessage = document.getElementById("userMessage").value;
    var conversation = document.getElementById("conversation");
    conversation.innerHTML += `<div class="user"><strong>USER:</strong> ${userMessage}</div>`;
  }
  if (evt.detail.elt.id === "createChatButton") {
    location.reload();
  }
  if (evt.detail.elt.id === "deleteChatButton") {
    window.location.href = "/";
  }
});
window.addEventListener("load", function () {
  var link = document.querySelector('link[rel="preload"]');
  if (link) {
    link.onload = null;
    link.rel = "stylesheet";
  }
});
