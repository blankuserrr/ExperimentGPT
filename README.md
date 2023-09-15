# ExperimentGPT

Welcome to ExperimentGPT! This is a AI Chatbot that uses the ChatGPT API. I Currently it is in early alpha, and should be used as so, and not taken seriously. So far it has simple features such as just sending messages and clearing the conversation. The application is built with Bun.JS (previously Node.JS) and has a (still being worked on) semi modern frontend without any framework *(pure CSS!)* but it will be updated to use bootstrap in the future. 

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- Bun.JS
- npm
- Git

### Installation

1. Clone the repository:

`git clone https://github.com/Honkychunkymonkey/ExperimentGPT.git`

2. Navigate to the project directory:

```cd ExperimentGPT```

3. Install the dependencies:

```bun install```

4. Build all static files:

```bun run build```

## Running the Application

To start the application, run:

```bun run index.ts``` *OR* ```bun --watch run index.ts``` (for development)

The application will be available at `http://localhost:3000` (or whatever you set the port/URL to be.

## Future changes/Planned features

- The editing and deleting of messages
- Use of the OpenAI completions API to stream messages (typing effect) and the stopping of generation
- Settings for local (in browser) chats
- Pinecone support
- Multi API support (Kobold, OpenRouter, Anthropic, (Local LLM support in far future))

## License

This project is licensed under the Creative Comms Attribution Share Alike 4.0 International Liscense - see the [LICENSE.md](LICENSE.md) file for details.
