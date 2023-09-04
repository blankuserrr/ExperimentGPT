"use strict";
document.body.addEventListener("htmx:beforeRequest", function (evt) {
    const htmxEvt = evt;
    if (htmxEvt.detail.elt.id === "chatForm") {
        let userMessage = document.getElementById("userMessage");
        let conversation = document.getElementById("conversation");
        conversation.innerHTML += `<div class="user"><strong>USER:</strong> ${userMessage.value}</div>`;
        userMessage.value = ""; // Clear the input field
    }
    if (htmxEvt.detail.elt.id === "createChatButton") {
        location.reload();
    }
    if (htmxEvt.detail.elt.id === "deleteChatButton") {
        window.location.href = "/";
    }
});
document.getElementById("toChats")?.addEventListener("click", function () {
    window.location.href = "/";
});
const socket = io();
socket.on("new message", (newPart) => {
    const conversation = document.getElementById("conversation");
    let lastMessage = conversation.lastChild;
    if (lastMessage && lastMessage.className === "system") {
        // Append the new part of the response to the last system message
        lastMessage.innerHTML += newPart;
    }
    else {
        // Create a new system message
        const newMessage = document.createElement("div");
        newMessage.className = "system";
        newMessage.innerHTML = `<strong>SYSTEM:</strong> ${newPart}`;
        conversation.appendChild(newMessage);
    }
});
