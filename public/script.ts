document.body.addEventListener("htmx:beforeRequest", function (evt) {
  if (evt.detail.elt.id === "chatForm") {
    let userMessage = document.getElementById("userMessage") as HTMLInputElement;
    let conversation = document.getElementById("conversation") as HTMLDivElement;
    conversation.innerHTML += `<div class="user"><strong>USER:</strong> ${userMessage.value}</div>`;
    userMessage.value = ""; // Clear the input field
  }
  if (evt.detail.elt.id === "createChatButton") {
    location.reload();
  }
  if (evt.detail.elt.id === "deleteChatButton") {
    window.location.href = "/";
  }
});

window.addEventListener("load", function () {
  let link = document.querySelector('link[rel="preload"]') as HTMLLinkElement;
  if (link) {
    link.onload = null;
    link.rel = "stylesheet";
  }
});

document.getElementById("toChats").addEventListener("click", function () {
  window.location = "/";
});

const socket = io();

socket.on("new message", (newPart: string) => {
  const conversation = document.getElementById("conversation") as HTMLDivElement;
  let lastMessage = conversation.lastChild as HTMLDivElement;

  if (lastMessage && lastMessage.className === "system") {
    // Append the new part of the response to the last system message
    lastMessage.innerHTML += newPart;
  } else {
    // Create a new system message
    const newMessage = document.createElement("div");
    newMessage.className = "system";
    newMessage.innerHTML = `<strong>SYSTEM:</strong> ${newPart}`;
    conversation.appendChild(newMessage);
  }
});