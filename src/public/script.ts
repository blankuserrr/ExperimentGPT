/// <reference lib="dom" />
/// <reference lib="dom.iterable" />

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

document.body.addEventListener("htmx:beforeRequest", function (this: HTMLElement, evt) {
	const htmxEvt = evt as HTMXEvent;
	if (htmxEvt.detail.elt.id === "chatForm") {
		let userMessage = document.getElementById("userMessage") as HTMLInputElement;
		let conversation = document.getElementById("conversation") as HTMLDivElement;
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
});

window.addEventListener("load", function () {
	// Get the dropdown button
	const clearButton = document.getElementById("clearButton");
	const clearDropdown = document.getElementById("clearDropdown");

	// Toggle the dropdown content and button style when the button is clicked
	clearButton?.addEventListener("click", function () {
		console.log("Dropdown Clicked");
		const isDropdownShown = clearDropdown?.classList.contains("show");

		// Toggle the dropdown display
		clearDropdown?.classList.toggle("show", !isDropdownShown);

		// Toggle the class on the button based on the dropdown state
		this.classList.toggle("clearButton-active", !isDropdownShown);
	});

	// Close the dropdown if the user clicks outside of it
	window.onclick = function (event: MouseEvent) {
		if (!clearDropdown?.contains(event.target as Node) && !clearButton?.contains(event.target as Node)) {
			console.log("Dropdown Closing");
			clearDropdown?.classList.remove("show");
			clearButton?.classList.remove("clearButton-active");
		}
	};
});