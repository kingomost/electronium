# electronium

> A universal, Promise-based IPC bridge to seamlessly connect your Electron.js Main and Renderer processes.

Say goodbye to messy `ipcMain.on` and `ipcRenderer.send` spaghetti code. `electronium` provides a clean, type-safe, and bi-directional Request/Response architecture over native Electron IPC.

## 📑 Table of Contents

- [electronium](#electronium)
  - [📑 Table of Contents](#-table-of-contents)
  - [✨ Features](#-features)
  - [📦 Module Support (ESM \& CJS)](#-module-support-esm--cjs)
  - [📦 Installation](#-installation)
  - [🚀 Quick Start](#-quick-start)
    - [1. Main Process (`main.ts`)](#1-main-process-maints)
    - [2. Preload Script (`preload.ts`)](#2-preload-script-preloadts)
    - [3. Renderer Process (`app.ts` or React/Vue component)](#3-renderer-process-appts-or-reactvue-component)
  - [🔄 Bi-Directional Communication](#-bi-directional-communication)
  - [📖 API Reference](#-api-reference)
    - [`ApiNetwork` (Client-side API)](#apinetwork-client-side-api)
      - [`fetch(path, data, options?, onSuccess?, onError?)`](#fetchpath-data-options-onsuccess-onerror)
      - [`signal(path, data)`](#signalpath-data)
      - [`getDefaultTimeout()`](#getdefaulttimeout)
      - [`setDefaultTimeout(timeout)`](#setdefaulttimeouttimeout)
    - [`ApiServer` (Server-side API)](#apiserver-server-side-api)
      - [`init(apiEndpoints)`](#initapiendpoints)
      - [`addListener(path, listener)`](#addlistenerpath-listener)
      - [`removeListener(path, id)`](#removelistenerpath-id)
      - [`removeAllListeners(path)`](#removealllistenerspath)
  - [⚠️ Error Handling](#️-error-handling)
  - [🤝 Contributing](#-contributing)
  - [📄 License](#-license)

## ✨ Features

- **🚀 Promise-Based API:** Treat IPC calls like network requests (`fetch`). No more manual event matching.
- **🔄 Bi-Directional:** Send requests from Renderer-to-Main _and_ Main-to-Renderer. Create active endpoints on both sides.
- **⚡️ Signals & Emitters:** Built-in support for fire-and-forget signals and event subscriptions.
- **🛡️ Type-Safe:** Written entirely in TypeScript with deep inference support.
- **📦 Zero Dependencies:** Lightweight and fast, built entirely on native Electron APIs.
- **🧩 Framework Agnostic:** Works perfectly with React, Vue, Svelte, or Vanilla JS.

## 📦 Module Support (ESM & CJS)

This package ships with **dual module support**, providing seamless integration for both modern and legacy projects.
It supports both **ESM (ECMAScript Modules)** and **CJS (CommonJS)** out of the box, allowing you to use `import` or `require()` depending on your project's module resolution.
TypeScript definitions are fully included for both standards.

## 📦 Installation

```bash
npm install electronium
```

> **Important:** You must have the main framework [Electron](https://www.electronium.org/) installed in your project. `electronium` provides advanced functionality to extend Electron's native IPC, making development significantly easier and more structured.

Install both:

```bash
npm install electron
npm install electronium
```

## 🚀 Quick Start

Setting up the bridge takes less than a minute. You need to configure three parts of your Electron app:

### 1. Main Process (`main.ts`)

Initialize the backend adapter and define your API endpoints.

```typescript
import { BrowserWindow, ipcMain } from "electron";
import { BackendApiAdapter } from "electronium";

const mainWindow = new BrowserWindow({
  webPreferences: {
    nodeIntegration: true,
    preload: "path/to/preload.js",
  },
});

// Initialize the bridge
const adapter = new BackendApiAdapter(mainWindow, ipcMain);
const server = adapter.getServer();

// Define your backend API
server.init({
  "get-user-data": async (data, sendResponse) => {
    // Perform database operations, read files, etc.
    const user = { id: data.id, name: "Alice" };

    // Send data back to the renderer
    sendResponse({ user });
  },
});
```

### 2. Preload Script (`preload.ts`)

Securely expose the frontend adapter to the renderer process.

```typescript
import { contextBridge, ipcRenderer } from "electron";
import { FrontendApiAdapter } from "electronium";

const adapter = new FrontendApiAdapter(ipcRenderer);

// Expose the network adapter to the window object
contextBridge.exposeInMainWorld("api", {
  network: adapter.getNetwork(),
});
```

### 3. Renderer Process (`app.ts` or React/Vue component)

Make seamless, promise-based calls to your backend API.

```typescript
// 1. Await a response from the Main process
async function loadUser() {
  try {
    const response = await window.api.network.fetch("get-user-data", { id: 123 });
    console.log("User data:", response.user);
  } catch (error) {
    console.error("Failed to load user:", error);
  }
}

// 2. Send a fire-and-forget signal (no response expected)
function logClick() {
  window.api.network.signal("user-clicked", { x: 100, y: 200 });
}
```

## 🔄 Bi-Directional Communication

A key feature of `electronium` is its **true bi-directional architecture**.
You can create server imitations (endpoints) on both the **Backend (Main process)** and the **Frontend (Renderer process)**.

- The **Main process** can act as an `ApiServer` to handle requests from the frontend, but it can _also_ act as an `ApiNetwork` client to fetch data or trigger actions on the frontend.
- The **Renderer process** can expose its own `ApiServer` endpoints (e.g., to handle system events pushed by the Main process) while continuing to act as an `ApiNetwork` client.

Active endpoints can be created and consumed seamlessly on both sides, making the communication robust and flexible.

## 📖 API Reference

### `ApiNetwork` (Client-side API)

Used to send requests across the bridge.

#### `fetch(path, data, options?, onSuccess?, onError?)`

Sends a request and returns a Promise that resolves when the server calls `sendResponse`.

- **`path`**: The endpoint path.
- **`data`**: The payload data.
- **`options`**: Optional configuration parameters, such as timeout.
- **`onSuccess` / `onError`**: Optional callbacks. If omitted, returns a Promise.

#### `signal(path, data)`

Sends a fire-and-forget message. No response is awaited and no promise is returned.

- **`path`**: The endpoint path.
- **`data`**: The payload data.

#### `getDefaultTimeout()`

Retrieves the current default timeout for `fetch` requests (default is 1000ms).

- **Returns**: The timeout in milliseconds.

#### `setDefaultTimeout(timeout)`

Configures the default timeout (in milliseconds) for all subsequent `fetch` requests.

- **`timeout`**: The new timeout in milliseconds.

### `ApiServer` (Server-side API)

Used to handle incoming requests.

#### `init(apiEndpoints)`

Initializes the server and registers multiple endpoints at once. Replaces any previously registered handlers.

- **`apiEndpoints`**: A dictionary where the key is the path, and the value is a `RequestHandler` that receives `(data, sendResponse)`.

#### `addListener(path, listener)`

Registers a passive listener for a specific endpoint path. This allows you to listen to incoming messages without responding to them (useful for logging, analytics, or side-effects) and without conflicting with the main `RequestHandler`.

- **`path`**: The endpoint path.
- **`listener`**: The function to execute when the endpoint receives a message.
- **Returns**: A unique `string` identifier for the listener.

#### `removeListener(path, id)`

Removes a specific passive listener by its unique identifier.

- **`path`**: The endpoint path the listener was registered on.
- **`id`**: The unique identifier returned by `addListener`.

#### `removeAllListeners(path)`

Removes all passive listeners for a specific endpoint path.

- **`path`**: The endpoint path.

## ⚠️ Error Handling

Errors thrown or returned from the server are automatically propagated to the client.

```typescript
// Backend
server.init({
  "delete-file": (data, sendResponse) => {
    sendResponse({ error: { message: "File not found", code: 404 } });
  },
});

// Frontend
try {
  await window.api.network.fetch("delete-file", { fileId: 1 });
} catch (error) {
  console.log(error.message); // Outputs: {"message":"File not found","code":404}
}
```

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/kingomost/electronium/issues).

## 📄 License

This project is [MIT](./LICENSE) licensed. © Aleksei Klimov
