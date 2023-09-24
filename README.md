# ExperimentGPT

Welcome to ExperimentGPT! This is an AI Chatbot that uses the OpenAI API. So far it has features such as sending messages with support for streaming the response, multi-conversation management, authentication system, and clearing the conversation. The application is built with Bun (previously Node.JS) and has a (still being worked on) semi modern frontend without any framework *(pure CSS!)* but it will be updated to use bootstrap in the future. 

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- [Bun](https://bun.sh/)
- Git (Only if contributing or pulling updated)

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

The application will be available at `http://localhost:3000` (or whatever you set the port/URL to be.)

## Future changes/Planned features

- The editing and deleting of messages.
- Modification of my current use of the OpenAI API to implement the stopping of generation.
- Settings for local (in browser) chats.
- PineconeDB support (for nearly infinite memory using semantic search.)
- Multi API support (OpenRouter, Anthropic, Azure, Replicate, HuggingFace, etc (Local LLMs like Kobld support in far future))

## License

This project is licensed under the Creative Comms Attribution Share Alike 4.0 International Liscense - see the [LICENSE.md](LICENSE.md) file for details.
