"use strict";
function escapeHTML(unsafeText) {
    let div = document.createElement('div');
    div.textContent = unsafeText;
    return div.innerHTML;
}
document.body.addEventListener("htmx:beforeRequest", function (evt) {
    const htmxEvt = evt;
    if (htmxEvt.detail.elt.id === "chatForm") {
        let userMessage = document.getElementById("userMessage");
        let conversation = document.getElementById("conversation");
        let escapedMessage = escapeHTML(userMessage.value);
        conversation.innerHTML += `<div class="user"><strong>USER:</strong> ${escapedMessage}</div>`;
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
    // Apply Prism.js highlighting to new code blocks
    var text = conversation.innerHTML;
    var regex = /```(\w+)\s([\s\S]*?)```/g;
    var match;
    while ((match = regex.exec(text)) !== null) {
        var language = match[1];
        var code = match[2];
        var codeElement = document.createElement('code');
        codeElement.className = 'language-' + language;
        codeElement.textContent = code;
        var preElement = document.createElement('pre');
        preElement.appendChild(codeElement);
        var highlightedCode = preElement.outerHTML;
        text = text.replace(match[0], highlightedCode);
    }
    conversation.innerHTML = text;
    Prism.highlightAllUnder(conversation);
});
