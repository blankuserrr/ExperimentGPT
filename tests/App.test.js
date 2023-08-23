const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// Function to create a new chat.json file
function createChatFile(messages) {
  const date = new Date();
  const formattedDate = `${date.getDate()}-${date.getMonth()+1}-${date.getFullYear()}-${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}`;
  const chatFilePath = path.join(__dirname, 'Test Chats', `chat-${formattedDate}.json`);
  fs.writeFileSync(chatFilePath, JSON.stringify(messages));
}

test('should display chat interface', async ({ page }) => {
  await page.goto('http://localhost:3000');
  const chatForm = await page.$('#chatForm');
  expect(chatForm).toBeTruthy();
});

test('should send a message', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.fill('#userMessage', 'Hello, world!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000); // Wait for the response from the server
    const messages = await page.$$eval('#conversation div', elements => elements.map(el => el.textContent));
    createChatFile(messages); // Create a new chat.json file
    const userMessage = messages.find(message => message.startsWith('USER: Hello, world!'));
    expect(userMessage).toBeTruthy();
  });

test('should clear the conversation', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.click('#clearButton');
  const messages = await page.$$eval('#conversation div', elements => elements.map(el => el.textContent));
  expect(messages.length).toBe(0);
});