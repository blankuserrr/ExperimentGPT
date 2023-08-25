# ExperimentGPT

Welcome to ExperimentGPT! This is a AI Chatbot that uses the ChatGPT API. I Currently it is in early alpha, and should be used as so, and not taken seriously. So far it has simple features such as just sending messages and clearing the conversation. It also uses Playwright for testing, but you might experience issues without root or elevated permissions. The application is built with Node.JS and has a (still being worked on) semi modern frontend without any framework *(pure CSS!)*

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- Node.js
- npm
- Git

### Installation

1. Clone the repository:

```git clone https://github.com/Honkychunkymonkey/ExperimentGPT.git```

2. Navigate to the project directory:

```cd ExperimentGPT```

3. Install the dependencies:

```npm install```

### Directory Setup

1. Create a `chats` folder in the root directory.

2. Inside the `chats` folder, create a `chat.json` file that contains an empty array: []

#### Optional set-up for tests using Playwright.
3. In the `tests` folder, create a `Test Chats` folder. Leave this folder empty for now. (run npm test to run it)

## Running the Application

To start the application, run:

```npm start```


The application will be available at `http://localhost:3000`.

## Running the Tests

To run the tests, use:

```npm test```

## Future changes/Planned features

* The editing and deleting of messages
* Use of the OpenAI completions API to stream messages (typing effect) and the stopping of generation
* Settings for local (in browser) chats
* Experimental ChatGPT + Pupeteer for browsing the internet without doing anything but typing.
* Pinecone support
* Multi API support (Kobold, OpenRouter, Anthropic, (Local LLM support in far future))

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Acknowledgments

- Thanks to Playwright for providing the testing framework.
- Thanks to all contributors who have helped to improve this project.
