# Understanding the Open Canvas Codebase

## Introduction to Open Canvas
Open Canvas is an open-source web application designed for collaborative document writing with AI agents. Its primary purpose is to provide a flexible and intelligent environment where users can create and refine various types of documents, including text and code, with the assistance of AI.

A key goal of Open Canvas is to enhance the writing process by allowing users to seamlessly integrate AI capabilities into their existing workflows. Unlike some other platforms, Open Canvas is committed to being open source, with all its code, from the frontend to the content generation and reflection agents, available under an MIT license.

Open Canvas distinguishes itself with several key features:
*   **Built-in Memory**: The application includes a reflection agent that stores style rules and user insights in a shared memory store. This enables Open Canvas to remember user preferences and context across different sessions, leading to a more personalized experience.
*   **Start from Existing Documents**: Users are not forced to begin with a chat interaction. Instead, Open Canvas allows them to start with a blank text or code editor in their preferred language, or to import their existing content and iterate on it with AI assistance. This is particularly useful when users already have a draft or a base document to work from.
*   **Live Markdown Rendering & Editing**: The markdown editor in Open Canvas allows users to see the rendered output in real-time as they edit, eliminating the need to switch between editing and preview modes.
*   **Artifact Versioning**: All documents (referred to as artifacts) have version control, allowing users to track changes and revert to previous versions if needed.
*   **Customizable Quick Actions**: Users can define their own prompts as custom quick actions, which are tied to their user profile and persist across sessions, allowing for easy invocation of personalized AI tasks.

## High-Level Architecture
Open Canvas is structured as a monorepo, managed by Turborepo, which facilitates the organization and build process of its different components. This structure allows for shared code and streamlined development across the project.

The architecture primarily consists of two main application components:

1.  **`apps/web`**: This directory contains the frontend application of Open Canvas. It is a Next.js web application (as indicated by `next.config.mjs` and common Next.js project structure within `apps/web/src/app/`). Users interact with this application through their web browser. It handles user authentication (via Supabase), provides the user interface for document editing and chat interactions, and communicates with the backend agent system.

2.  **`apps/agents`**: This directory houses the backend AI agent system. It runs as a LangGraph server, exposing an API (typically on port 54367 as per the README) that the frontend consumes. This component is responsible for processing user requests, interacting with various Large Language Models (LLMs), managing the AI's memory (style rules, user insights), and executing tasks like content generation, reflection, and summarization. It contains the core logic for the different AI agents (e.g., Open Canvas agent, reflection agent).

In addition to these core applications, the monorepo includes a `packages/` directory for shared and auxiliary code:

*   **`packages/shared`**: This package contains code that is shared between the `apps/web` frontend and the `apps/agents` backend. This typically includes data structures, type definitions (e.g., for API requests/responses, artifact structures), shared utility functions, and configurations like LLM model definitions (`packages/shared/src/models.ts`). This promotes consistency and reduces code duplication.

*   **`packages/evals`**: This package is dedicated to the evaluation and testing of the AI agents. It likely contains scripts, datasets, and test suites (e.g., integration tests like `agent.int.test.ts`) to assess the performance, accuracy, and behavior of the agents in `apps/agents`. This is crucial for maintaining and improving the quality of the AI functionalities.

Authentication is handled externally by Supabase, and LangSmith is used for tracing and observability of the LangGraph server. The overall system is designed to be modular, allowing for different LLMs to be integrated and for new features to be developed within this structured framework.

## Frontend Deep Dive: `apps/web`
The `apps/web` directory contains the frontend of the Open Canvas application. It is a **Next.js application**, leveraging the App Router paradigm for routing and application structure.

Its main responsibilities include:

*   **User Interface (UI) and User Experience (UX)**: This application is responsible for rendering the entire user interface that users interact with. This includes the main canvas area for document editing, the chat interface for interacting with AI agents, user dashboards, and settings pages. It aims to provide an intuitive and responsive experience.
*   **Handling User Interactions**: It captures and processes all user inputs, such as typing in the editor, sending messages in the chat, triggering quick actions, uploading files, and managing account settings.
*   **Managing Authentication**: The frontend handles user authentication flows, including login, signup, and session management. As noted in the project's README, it integrates with **Supabase** for these authentication services.
*   **Communicating with the `apps/agents` Backend**: A crucial role of the frontend is to make API calls to the `apps/agents` LangGraph server. It sends user queries and document content to the backend for AI processing and receives the generated outputs (e.g., new text, code, reflections) to display to the user.

For a newcomer looking to understand the `apps/web` frontend, the following directories are key places to explore:

*   **`apps/web/src/app/`**: This is the core directory for the Next.js App Router. It contains the page definitions, layouts, and routing structure of the application. For example, `apps/web/src/app/page.tsx` is likely the main entry point for the application's UI after login, and directories like `apps/web/src/app/auth/` handle authentication-related pages. The `api/` subdirectory within `apps/web/src/app/` likely contains frontend API routes used for specific client-side functionalities or proxying requests.
*   **`apps/web/src/components/`**: This directory houses the reusable UI components that make up the application's interface. These components range from basic UI elements (buttons, inputs, dialogs found in `apps/web/src/components/ui/`) to more complex, feature-specific components like those for rendering artifacts (`apps/web/src/components/artifacts/`), managing the chat interface (`apps/web/src/components/chat-interface/`), and the main canvas (`apps/web/src/components/canvas/`).
*   **`apps/web/src/contexts/`**: This directory likely contains React Context providers for managing global state or shared data across different parts of the application (e.g., `UserContext.tsx`, `AssistantContext.tsx`).
*   **`apps/web/src/hooks/`**: Custom React hooks are stored here, providing reusable logic for state management, side effects, and other concerns (e.g., `useFeedback.ts`, `useStore.tsx`).
*   **`apps/web/src/lib/`**: This directory typically contains utility functions, helper scripts, and libraries specific to the frontend application, including Supabase client setup (`apps/web/src/lib/supabase/`) and other shared logic.
*   **`apps/web/public/`**: Static assets that are served directly by the web server, such as images (e.g., `screenshot.png`, `lc_logo.jpg`), favicons, and other public files, are located here.
*   **`apps/web/.env.example`**: This file serves as a template for the necessary environment variables required to run the frontend application. It includes configurations like Supabase URL and API keys, and settings for connecting to the LangGraph backend. Developers would typically copy this to a `.env` file and populate it with their specific credentials and endpoints.

Understanding these directories and their roles will provide a solid foundation for navigating and contributing to the Open Canvas frontend.

## Backend Deep Dive: `apps/agents`
The `apps/agents` directory contains the backend system of the Open Canvas application. This is where the core AI logic resides and is powered by **LangGraph**, a framework for building stateful, multi-actor applications with LLMs. As highlighted in the project's README, LangGraph is central to how Open Canvas orchestrates agent interactions, manages state across those interactions, and implements memory capabilities.

Based on the directory structure within `apps/agents/src/`, the backend agents possess a range of capabilities:

*   **`open-canvas`**: This appears to be the primary agent or graph. It contains various "nodes" (LangGraph's term for individual processing units) that suggest a wide array of functionalities. These include:
    *   Generating new artifacts (`generate-artifact`)
    *   Creating follow-up responses (`generateFollowup`)
    *   Performing reflection (`reflect`)
    *   Rewriting existing artifacts (`rewrite-artifact`, `rewriteArtifactTheme`, `rewriteCodeArtifactTheme`)
    *   Updating artifacts (`updateArtifact`, `updateHighlightedText`)
    *   Generating titles (`generateTitle`)
    *   Summarizing content (`summarizer`)
    *   Handling custom actions (`customAction`) and general user input (`replyToGeneralInput`).
*   **`reflection`**: This directory directly corresponds to the "reflection agent" mentioned in the README. It's responsible for analyzing user interactions and style to build a persistent memory, enabling more personalized AI assistance over time.
*   **`summarizer`**: This component likely provides dedicated text summarization services, which can be invoked by other agents or directly through API calls.
*   **`thread-title`**: This suggests an agent specifically designed to generate concise and relevant titles for conversation threads or documents, improving organization and navigation.
*   **`web-search`**: This indicates that the agents have the capability to perform web searches (e.g., using ExaSearch or FireCrawl as mentioned in the README's API prerequisites). This allows the AI to fetch and incorporate external information into its responses or document generation.

The primary roles of the `apps/agents` backend are:

*   **Handling Core Logic for Content Generation and Document Assistance**: It processes requests from the `apps/web` frontend, orchestrating complex workflows to generate text, code, or other document modifications.
*   **Interacting with Various Large Language Models (LLMs)**: It manages connections to and interactions with the configured LLMs (e.g., OpenAI, Anthropic, Fireworks AI). The file `apps/agents/src/utils.ts` (seen in previous `ls` outputs and mentioned in the README for model configuration) likely plays a role in this.
*   **Managing Agent Memory and Reflection Processes**: Through LangGraph's state management and the dedicated `reflection` agent, it maintains memory of user preferences, style, and past interactions to provide a tailored experience.

For anyone looking to understand the backend AI implementations, **`apps/agents/src/`** is the main entry point. This directory contains the source code for all the agents and their constituent nodes, state definitions, and prompts.

Finally, **`apps/agents/.env.example`** (which is distinct from the one in `apps/web/`) outlines the specific environment variables required for the backend to operate. This includes API keys for various LLMs and other services (like FireCrawl, ExaSearch), and potentially configurations for the LangGraph server itself. This file is critical for setting up a local development environment for the agents.

## Shared Code: The `packages/` Directory
The `packages/` directory in the Open Canvas monorepo hosts code that is not part of a specific application (`apps/web` or `apps/agents`) but serves a supporting or shared role. This modular approach is common in monorepos managed by tools like Turborepo, promoting code reuse and separation of concerns. The two primary packages are `packages/shared` and `packages/evals`.

### `packages/shared`
The `packages/shared` directory is crucial for maintaining consistency and reducing redundancy between the frontend (`apps/web`) and the backend (`apps/agents`). Its primary purpose is to house code that is used by both applications.

Examples of code found in `packages/shared` include:

*   **Data Models and Types (`src/types.ts`, `src/models.ts`)**: This is one of the most important roles of `packages/shared`. It defines the structure of data that is exchanged between the frontend and backend. For instance, the format of an "artifact" (the document being edited), user profiles, or API request/response payloads are likely defined here. The file `src/models.ts` is specifically mentioned in the README for configuring LLM models, indicating it holds definitions related to model providers and their settings.
*   **Constants (`src/constants.ts`)**: Any constant values that need to be available to both the frontend and backend, such as specific event names, configuration keys, or default settings, would be defined here.
*   **Utility Functions (`src/utils/`)**: Common utility functions that are not specific to either the frontend or backend logic but can be useful in both contexts. This could include functions for string manipulation, date formatting, or other general-purpose tasks.
*   **Prompts (`src/prompts/`)**: It might also contain shared prompt templates or structures if there's a need for consistency in how prompts are defined or accessed across different parts of the system, though many prompts are also located within `apps/agents` specific to their use case.

By centralizing these shared elements, `packages/shared` helps ensure that the frontend and backend are aligned in terms of data structures and core configurations, making development and maintenance more efficient.

### `packages/evals`
The `packages/evals` directory is dedicated to the evaluation and testing of the AI agents developed in `apps/agents`. The quality and reliability of AI agents are paramount, and this package provides the infrastructure for assessing their performance.

Key aspects of `packages/evals` include:

*   **Agent Performance Testing**: This package houses the tools and scripts necessary to run evaluations on the AI agents. This could involve programmatic interactions with the agents to see if they produce the desired outputs, follow instructions correctly, or adhere to specific behavioral guidelines.
*   **Test Suites (e.g., `src/agent.int.test.ts`)**: The presence of files like `agent.int.test.ts` indicates that there are integration tests specifically designed to test the functionality of the agents. These tests likely simulate user interactions or specific scenarios to verify agent responses and behavior.
*   **Test Data (`src/data/`)**: The `data/` subdirectory suggests that this package may also contain datasets used for testing. These datasets could include sample inputs, expected outputs, or specific edge cases to ensure the agents are robust.
*   **Evaluation Metrics and Tooling**: While not explicitly detailed in the file listing, this package might also include scripts for defining and calculating performance metrics (e.g., accuracy, coherence, safety) for the agents.

The `packages/evals` directory is essential for a data-driven approach to improving the AI capabilities of Open Canvas, allowing developers to systematically track and enhance agent performance.

By having these distinct packages, the Open Canvas project maintains a clean and organized codebase where shared logic is easily accessible and reusable, and where dedicated tooling for agent evaluation can be developed and maintained independently.

## Key Technologies and Dependencies
Open Canvas leverages a modern technology stack to deliver its collaborative document editing and AI agent capabilities. Here's an outline of the key technologies and dependencies used in the project:

*   **Frontend (`apps/web`):**
    *   **Next.js:** A popular React framework for building server-side rendered and statically generated web applications. It provides routing, a development server, build optimizations, and the App Router structure used in this project.
    *   **React:** (Implied by Next.js) A JavaScript library for building user interfaces, forming the foundation of the frontend components and interactions.
    *   **Tailwind CSS:** (Inferred from `tailwind.config.ts` in `apps/web/`) A utility-first CSS framework for rapidly styling web applications.
    *   **Shadcn/ui:** (Inferred from `components.json` and common component structure in `apps/web/src/components/ui/`) A collection of accessible and reusable UI components built with Radix UI and Tailwind CSS.

*   **Backend (`apps/agents`):**
    *   **LangGraph:** The core framework for building the AI agent system. LangGraph allows for the creation of stateful, multi-actor applications with Large Language Models (LLMs), enabling complex interactions, memory, and tool usage for the agents. The backend is run using the LangGraph CLI.

*   **Programming Language:**
    *   **TypeScript:** The entire project, including the frontend, backend, and shared packages, is written in TypeScript. This adds static typing to JavaScript, improving code quality, maintainability, and developer productivity. (Indicated by `tsconfig.json` files throughout the project and `.ts`/`.tsx` file extensions).

*   **Package Management:**
    *   **Yarn:** Used for managing project dependencies and running scripts. (Indicated by `yarn.lock` and `package.json` files using Yarn commands).

*   **Monorepo Management:**
    *   **Turborepo:** Utilized to manage the monorepo structure, optimizing build times, and managing dependencies across the different applications (`apps/web`, `apps/agents`) and packages (`packages/shared`, `packages/evals`). (Indicated by `turbo.json` files).

*   **Authentication:**
    *   **Supabase:** An open-source Firebase alternative used for handling user authentication (signup, login, session management) and potentially other backend-as-a-service features like database interactions if used beyond authentication.

*   **LLM Interaction & Providers:**
    *   The system is designed to be flexible with LLM providers, supporting:
        *   **OpenAI API** (e.g., GPT models)
        *   **Anthropic API** (e.g., Claude models)
        *   **Fireworks AI API** (e.g., Llama models)
        *   **Google GenAI API** (optional)
        *   **Groq AI API** (optional, for audio/video transcription)
        *   **Ollama:** Support for running local LLMs via Ollama is also included, allowing users to connect to their own self-hosted models.
    *   The `apps/agents` backend manages the interactions with these LLMs, and `packages/shared/src/models.ts` likely contains configurations for them.

*   **Observability:**
    *   **LangSmith:** Used for tracing and observability of the LangGraph-powered agents. This helps in debugging, monitoring, and understanding the behavior of the AI agents.

*   **Other External Services (Optional):**
    *   **FireCrawl API:** For web scraping capabilities, likely used by the `web-search` agent.
    *   **ExaSearch API:** For web search functionalities, also likely used by the `web-search` agent.

This combination of technologies enables Open Canvas to provide a rich user experience, powerful AI capabilities, and a maintainable and scalable codebase.

## Development and Setup Process
Setting up Open Canvas for local development involves several key steps, from cloning the repository to running the separate frontend and backend services. The process relies on specific prerequisites and careful configuration of environment variables.

### Prerequisites
Before starting the setup, ensure you have the following:

*   **Package Manager:** [Yarn](https://yarnpkg.com/) is required for dependency management and running scripts.
*   **API Keys & External Services:**
    *   **LLM APIs:** At least one API key for a supported Large Language Model provider is necessary. The primary ones are:
        *   [OpenAI API key](https://platform.openai.com/signup/)
        *   [Anthropic API key](https://console.anthropic.com/)
        *   (Optional) Keys for Google GenAI, Fireworks AI, Groq AI (for audio/video transcription).
    *   **Web Scraping/Search APIs (Optional):**
        *   [FireCrawl API key](https://firecrawl.dev)
        *   [ExaSearch API key](https://exa.ai)
    *   **Authentication:** A [Supabase](https://supabase.com/) account is needed for user authentication.
    *   **LangGraph Server:** The [LangGraph CLI](https://langchain-ai.github.io/langgraph/cloud/reference/cli/) is used to run the backend agent server locally.
    *   **LangSmith:** An account with [LangSmith](https://smith.langchain.com/) is needed for tracing and observability of the LangGraph agents.

### Key Setup Steps
1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/langchain-ai/open-canvas.git
    cd open-canvas
    ```

2.  **Install Dependencies:**
    Install all necessary project dependencies using Yarn. This command should be run from the root of the project.
    ```bash
    yarn install
    ```

3.  **Configure Environment Variables:**
    This is a critical step for securely managing API keys and service configurations. Open Canvas uses `.env` files for this purpose.
    *   **For the LangGraph Server (Backend):** In the root directory of the project, copy the example environment file:
        ```bash
        cp .env.example .env
        ```
        Then, edit the newly created `.env` file to include your API keys for LLMs (OpenAI, Anthropic, etc.), LangSmith, and any other backend-specific services.
    *   **For the Frontend Application:** Navigate to the `apps/web` directory and copy its example environment file:
        ```bash
        cd apps/web/
        cp .env.example .env
        cd ../.. # Navigate back to the root
        ```
        Edit `apps/web/.env` to include your Supabase project URL and anon key (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`), and any other frontend-specific configurations (like the LangGraph API URL if not using the default).

    **Importance of `.env` files:** These files store sensitive information like API keys. They are excluded from Git version control (via `.gitignore`) to prevent accidental exposure. Ensure these files are correctly populated with your credentials for the application to function.

4.  **Set up Authentication with Supabase:**
    *   Create a new project in your Supabase dashboard.
    *   Navigate to `Project Settings > API` and copy the `Project URL` and `anon public` API key. Paste these into the respective `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` variables in the `apps/web/.env` file.
    *   Go to the `Authentication > Providers` tab in Supabase and ensure `Email` is enabled (and `Confirm Email` is active). You can also enable other OAuth providers like GitHub or Google.

5.  **Build the Monorepo:**
    Since Open Canvas is a monorepo (managed by Turborepo), workspace dependencies need to be built so that different packages and applications can access them. Run this command from the root of the project:
    ```bash
    yarn build
    ```

6.  **Run the LangGraph Server (Backend):**
    Navigate to the `apps/agents` directory and start the LangGraph development server:
    ```bash
    cd apps/agents/
    yarn dev
    ```
    This typically runs the server on `http://localhost:54367`. You should see output indicating the API and LangSmith Studio UI URLs.

7.  **Run the Frontend Application:**
    In a separate terminal, navigate to the `apps/web` directory and start the Next.js development server:
    ```bash
    cd apps/web/
    yarn dev
    ```
    The frontend will usually be accessible at `http://localhost:3000`.

After completing these steps, you should be able to open `http://localhost:3000` in your browser, sign up or log in, and start interacting with your local Open Canvas instance. The setup process ensures that both the frontend and the AI agent backend are running and can communicate with each other, with all necessary services and API keys correctly configured.

## Getting Started: Pointers for Newcomers
If you're new to the Open Canvas codebase, here are some actionable steps to help you get acquainted and start contributing:

1.  **Read the Documentation First:**
    *   Begin by thoroughly reading the main `README.md` file in the root of the project. It provides a crucial overview of what Open Canvas is, its key features, and detailed instructions for local setup. Pay close attention to the "Setup locally" section.
    *   Review the other markdown documents generated as part of this codebase explanation (Introduction, Architecture, Frontend, Backend, etc.) to get a deeper understanding of specific components.

2.  **Explore the Core Applications:**
    *   **Backend Agents (`apps/agents/src/`):** Dive into this directory to understand the heart of the AI capabilities.
        *   Examine how LangGraph is used to define agent states, nodes, and transitions.
        *   Look at the different agent types (e.g., `open-canvas`, `reflection`, `web-search`) and their specific responsibilities.
        *   Identify where and how LLM calls are made and how prompts are constructed.
    *   **Frontend Application (`apps/web/src/`):** Investigate this directory to understand the user-facing part of Open Canvas.
        *   Explore the `app/` directory to see how Next.js App Router handles routing and page structure.
        *   Look into `components/` to see how UI elements are built and organized.
        *   Identify how user interactions are handled and how API calls are made to the `apps/agents` backend.

3.  **Understand Shared Code (`packages/shared/src/`):**
    *   Review the contents of this package, especially `models.ts` and `types.ts`. These files define the common data structures, type definitions, and model configurations used by both the frontend and backend. Understanding these will clarify how different parts of the system communicate.

4.  **Follow the Data Flow:**
    *   Pick a simple user action (e.g., sending a message in the chat, applying a quick action) and try to trace the data flow:
        *   How is the request initiated in the frontend (`apps/web`)?
        *   Which API endpoint in the backend (`apps/agents`) handles it?
        *   How does the corresponding LangGraph agent process the request?
        *   How is the response sent back and rendered in the UI?
    *   Using LangSmith (if set up) can be very helpful for visualizing the agent's execution flow.

5.  **Build and Run the Project Locally:**
    *   Follow the setup instructions in the `README.md` and `SETUP_AND_DEVELOPMENT.md` to get Open Canvas running on your local machine.
    *   Interacting with a live, local version of the application is one of the best ways to solidify your understanding of how all the pieces fit together.
    *   Experiment by making small, safe changes to see their effect.

6.  **Check Evaluation Tests (`packages/evals/src/`):**
    *   Explore the `packages/evals` directory, particularly files like `agent.int.test.ts`. This will give you insight into how the AI agents are tested and what criteria are used to evaluate their performance.

7.  **Examine `langgraph.json`:**
    *   At the root of the project, you'll find a `langgraph.json` file. This file is likely used by the LangGraph framework, possibly for defining or configuring graphs, persistence, or other settings related to the agent execution environment. While its exact role might require deeper investigation or LangGraph documentation, being aware of its existence is useful.

8.  **Review the Contribution Guide:**
    *   The "Contributing" section in the main `README.md` offers guidance on how to contribute to the project, including how issues are labeled (e.g., `frontend`, `ai`, `fullstack`). This is the best place to look for ways to get involved.
    *   Don't hesitate to reach out to the maintainers (e.g., Brace via email as mentioned in the README) if you have questions.

By following these steps, you should be able to build a solid understanding of the Open Canvas codebase and find areas where you can contribute. Start with the big picture and gradually dive into the specifics of the components that interest you most.
