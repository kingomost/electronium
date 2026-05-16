/**
 * Represents the structure of a message header.
 */
interface MessageHeader {
  /** Unique message identifier */
  id: string;
  /** IPC channel name */
  channel: string;
  /** Type of the message */
  type: "request" | "response" | "signal";
  /** Request timeout in milliseconds */
  timeout: number;
}

/**
 * Represents a standard IPC message payload.
 */
interface Message {
  /** The message header containing routing information */
  header: MessageHeader;
  /** Target endpoint path */
  path: string;
  /** Payload data */
  data: Record<string, unknown>;
}

/** Callback function that handles standard data responses */
type DataCallback = (res: Record<string, unknown>) => void;

/** Callback function that handles errors */
type ErrorCallback = (error: Error) => void;

/** Callback function that handles async responses */
type AsyncDataCallback = (res: Record<string, unknown>) => Promise<Record<string, unknown>>;

/** Represents a promise that resolves with data */
type DataPromise = Promise<Record<string, unknown>>;

/**
 * Handler for incoming requests.
 * @param data Request payload
 * @param sendResponse Callback to send a response back
 */
type RequestHandler = (
  data: Record<string, unknown>,
  sendResponse: (data: Record<string, unknown>) => void,
) => void | Promise<void>;

/** Listener for incoming messages */
type MessageListener = (data: Record<string, unknown>) => void | Promise<void>;

/** Represents an Electron BrowserWindow */
interface BrowserWindow {
  webContents: { send(channel: string, ...args: unknown[]): void | Promise<void> };
}

/** Represents Electron's ipcMain */
interface IpcMain {
  on(channel: string, listener: (event: unknown, ...args: unknown[]) => void): unknown;
}

/** Represents Electron's ipcRenderer */
interface IpcRenderer {
  send(channel: string, ...args: unknown[]): void;
  on(channel: string, listener: (event: unknown, ...args: unknown[]) => void): unknown;
}

/** A registered listener */
interface RegisteredListener {
  /** Unique ID of the listener */
  id: string;
  /** The listener handler function */
  handler: MessageListener;
}

/** Standard event emitter interface */
interface Emitter {
  on(uuid: string, callback: EventListener): void;
  emit(uuid: string, data: Record<string, unknown>): void;
  off(uuid: string, callback: EventListener): void;
}

/**
 * The client-side (caller) interface for the API.
 */
interface ApiNetwork {
  /**
   * Fetches data from an endpoint.
   * @param path The endpoint path.
   * @param data The payload data.
   * @param options Optional configuration (e.g., timeout).
   * @param onSuccess Optional success callback.
   * @param onError Optional error callback.
   * @returns A promise of the data if no callback is provided.
   */
  fetch<T extends null | DataCallback>(
    path: string,
    data: Record<string, unknown>,
    options?: Record<string, unknown> | null,
    onSuccess?: T | null,
    onError?: ErrorCallback | null,
  ): T extends null ? DataPromise : AsyncDataCallback;

  /**
   * Sends a signal without expecting a response.
   * @param path The endpoint path.
   * @param data The payload data.
   */
  signal(path: string, data: Record<string, unknown>): void;

  /**
   * Sets the default timeout for requests.
   * @param timeout The timeout in milliseconds.
   */
  setDefaultTimeout(timeout: number): void;

  /**
   * Gets the default timeout.
   * @returns The timeout in milliseconds.
   */
  getDefaultTimeout(): number;
}

/**
 * The server-side (receiver) interface for the API.
 */
interface ApiServer {
  /**
   * Initializes the server with endpoint handlers.
   * @param apiEndpoints A record of endpoint paths and their handlers.
   */
  init(apiEndpoints: Record<string, RequestHandler>): void;

  /**
   * Adds a listener for a specific path.
   * @param path The path to listen to.
   * @param listener The listener function.
   * @returns The ID of the listener.
   */
  addListener(path: string, listener: (data: Record<string, unknown>) => void | Promise<void>): string;

  /**
   * Removes a specific listener.
   * @param path The path the listener is bound to.
   * @param id The listener ID.
   */
  removeListener(path: string, id: string): void;

  /**
   * Removes all listeners for a path.
   * @param path The path to remove listeners from.
   */
  removeAllListeners(path: string): void;
}

/** Raw IPC message handler */
type MessageHandler = (_: unknown, message: unknown) => void;

/** Raw IPC message sender */
type MessageSender = (channel: string, message: unknown) => void | Promise<void>;

export type {
  ApiServer,
  ApiNetwork,
  DataCallback,
  AsyncDataCallback,
  DataPromise,
  MessageHeader,
  Message,
  Emitter,
  RequestHandler,
  MessageListener,
  RegisteredListener,
  BrowserWindow,
  IpcMain,
  IpcRenderer,
  MessageHandler,
  MessageSender,
  ErrorCallback,
};
