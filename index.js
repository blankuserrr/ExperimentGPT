const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const { Configuration, OpenAIApi } = require("openai");
const cors = require('cors');
const { GPTTokens } = require('gpt-tokens');
const Ai = require("ai");

dotenv.config();

const app = express();
app.use(bodyParser.json()); // Use JSON parser for body
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'public'));

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

let messages = [];

// Load existing chat history if available
const chatFilePath = path.join(__dirname, 'chats', 'chat.json');
if (fs.existsSync(chatFilePath)) {
  messages = JSON.parse(fs.readFileSync(chatFilePath, 'utf8'));
}

app.get('/', (req, res) => {
  res.render('index', { messages });
});

app.use(express.static(path.join(__dirname, 'public')));

app.post('/send', async (req, res) => {
  const userMessage = req.body.userMessage;
  messages.push({ role: 'system', content: 'You are a helpful assistant.' }, 
    { role: "user", content: userMessage });

  const chatCompletion = await openai.createChatCompletion({
    model: "gpt-3.5-turbo-0613",
    messages: messages,
  });

  const responseContent = chatCompletion.data.choices[0].message.content;
  messages.push({ role: "system", content: responseContent });

  // Save chat history to JSON file
  fs.writeFileSync(chatFilePath, JSON.stringify(messages));

   // Calculate tokens used
   const usageInfo = new GPTTokens({
    model: 'gpt-3.5-turbo-0613',
    messages: messages,
  });

  console.table({
    'Tokens prompt': usageInfo.promptUsedTokens,
    'Tokens total': usageInfo.usedTokens,
  });

  res.json({ messages });
});

// Clear conversation endpoint
app.post('/clear', (req, res) => {
  // Clear the messages array
  messages = [];

  // Clear the chat.json file
  fs.writeFileSync(chatFilePath, JSON.stringify(messages));

  res.json({ success: true });
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});