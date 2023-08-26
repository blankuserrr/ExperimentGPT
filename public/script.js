document.body.addEventListener("htmx:beforeRequest", function (evt) {
  if (evt.detail.elt.id === "chatForm") {
    var userMessage = document.getElementById("userMessage").value;
    var conversation = document.getElementById("conversation");
    conversation.innerHTML += `<div class="user"><strong>USER:</strong> ${userMessage}</div>`;
  }
});
