document.getElementById('chatForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const userMessage = document.getElementById('userMessage').value;

    // Append user message to conversation
    const conversationDiv = document.getElementById('conversation');
    const userDiv = document.createElement('div');
    userDiv.className = 'user';
    userDiv.innerHTML = `<strong>USER:</strong> ${userMessage}`;
    conversationDiv.appendChild(userDiv);

     // Clear the input field immediately
     document.getElementById('userMessage').value = '';

    fetch('/send', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `userMessage=${encodeURIComponent(userMessage)}`
    })
    .then(response => response.json())
    .then(data => {
        const systemMessage = data.messages[data.messages.length - 1];
        const div = document.createElement('div');
        div.className = 'system';
        div.innerHTML = `<strong>${systemMessage.role.toUpperCase()}:</strong> ${systemMessage.content}`;
        conversationDiv.appendChild(div);

        // Scroll to the bottom of the chat container
        conversationDiv.scrollTop = conversationDiv.scrollHeight;

        document.getElementById('userMessage').value = '';
    });
});

document.getElementById('clearButton').addEventListener('click', function() {
    fetch('/clear', {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const conversationDiv = document.getElementById('conversation');
            conversationDiv.innerHTML = '';
        }
    });
});