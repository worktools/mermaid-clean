# Mermaid Live Editor

A simple, real-time Mermaid diagram editor built with Vite and vanilla JavaScript. It provides a side-by-side view with a text editor on the left and a live preview on the right. Syntax errors are displayed below the editor.

This project was bootstrapped by Google's Gemini.

## Features

-   Live preview of Mermaid diagrams.
-   Syntax error highlighting.
-   Minimalist UI using plain DOM APIs.
-   Built with Vite for a fast development experience.

## Getting Started

### Prerequisites

-   [Node.js](httpss://nodejs.org/) (v20 or later recommended)
-   [Yarn](httpss://yarnpkg.com/)

### Installation & Running Locally

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Install dependencies:**
    ```bash
    yarn install
    ```

3.  **Start the development server:**
    ```bash
    yarn dev
    ```

The application will be available at the local address provided by Vite (usually `http://localhost:5173`).

## Build

To create a production build, run:

```bash
yarn build
```

The static assets will be generated in the `dist/` directory.
