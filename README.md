# ExperimentGPT

Welcome to ExperimentGPT! This is an AI Chatbot that uses the OpenAI API. So far it has features such as sending and streaming messages, multi-conversation management, authentication, and clearing the conversation. The application is built with express and Bun (previously Node) and has a (still being worked on) semi modern frontend without any framework *(pure CSS!)* but it will be updated to use tailwind in the future. 

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

```bun index.ts```

The application will be available at `http://localhost:3000` (or whatever you set the port/URL to be.)

## Future changes/Planned features

- The editing and deleting of messages.
- API/Backend update for the stopping of generation.
- Settings modal for greater configuration.
- PineconeDB support (for nearly infinite memory using semantic search.)
- Multi API support (OpenRouter, Anthropic, Azure, Replicate, HuggingFace, etc (Local LLMs like Kobld support in far future))
- Node.js fallback if Bun isn't being used.

## License

This project is licensed under the Creative Comms Attribution Share Alike 4.0 International Liscense - see [LICENSE.md](LICENSE.md) for details.
