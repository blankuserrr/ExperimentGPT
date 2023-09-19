declare var io: any;

interface HTMXEvent extends Event {
    detail: {
        elt: {
            id: string;
        };
    };
}

function escapeHTML(unsafeText: string): string {
    let div = document.createElement("div");
    div.textContent = unsafeText;
    return div.innerHTML;
}

function handleMessage(msg: HTMXEvent, id: string) {
    let userMessage = document.getElementById("userMessage") as HTMLInputElement;
    let conversation = document.getElementById("conversation") as HTMLDivElement;
    let escapedMessage = escapeHTML(userMessage.value);
    conversation.innerHTML += `<div class="${id}"><strong>${id.toUpperCase()}:</strong> ${escapedMessage}</div>`;
    userMessage.value = ""; // Clear the input field
}

function handleCreateChatButton(msg: HTMXEvent, id: string) {
    if (msg.detail.elt.id === id) {
        location.reload();
    }
}

function handleDeleteChatButton(msg: HTMXEvent, id: string) {
    if (msg.detail.elt.id === id) {
        window.location.href = "/";
    }
}

function registerBodyListener() {
    document.body.addEventListener("htmx:beforeRequest", function (this: HTMLElement, evt) {
        const htmxEvt = evt as HTMXEvent;
        handleMessage(htmxEvt, "chatForm")
        handleCreateChatButton(htmxEvt, "createChatButton");
        handleDeleteChatButton(htmxEvt, "deleteChatButton");
    });
}

function goToChats() {
    document.getElementById("toChats")?.addEventListener("click", function () {
        window.location.href = "/";
    });
}

function socketListener() {
    const socket = io();
    socket.on("new message", (newPart: string) => {
        modifyConversations(newPart);
    });
}

function modifyConversations(newPart: string) {
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

    applyCodeHighlight(conversation);
}

function applyCodeHighlight(conversation: HTMLDivElement) {
    // Apply Prism.js highlighting to new code blocks
    var text = conversation.innerHTML;
    var regex = /```(\w+)\s([\s\S]*?)```/g;
    var match;
    while ((match = regex.exec(text)) !== null) {
        var language = match[1];
        var code = match[2];
        var codeElement = document.createElement("code");
        codeElement.className = "language-" + language;
        codeElement.textContent = code;
        var preElement = document.createElement("pre");
        preElement.appendChild(codeElement);
        var highlightedCode = preElement.outerHTML;
        text = text.replace(match[0], highlightedCode);
    }
    conversation.innerHTML = text;
    Prism.highlightAllUnder(conversation);
}

// Call the respective functions
registerBodyListener();
goToChats();
socketListener();
