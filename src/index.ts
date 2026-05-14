/**
 * Universal library to extend Electron functionality with a unified IPC API.
 * This module exports the main classes and types for both frontend (renderer) and backend (main) processes.
 */
import { BackendApiAdapter } from "./api/back.ts";
import { FrontendApiAdapter } from "./api/front.ts";
import type {
  ApiNetwork,
  ApiServer,
  BrowserWindow,
  IpcMain,
  IpcRenderer,
  DataPromise,
  AsyncDataCallback,
  DataCallback,
  ErrorCallback,
  RequestHandler,
} from "./api/index.js";

export type {
  ApiServer,
  ApiNetwork,
  DataCallback,
  AsyncDataCallback,
  DataPromise,
  ErrorCallback,
  RequestHandler,
  BrowserWindow,
  IpcMain,
  IpcRenderer,
};
export { BackendApiAdapter, FrontendApiAdapter };
