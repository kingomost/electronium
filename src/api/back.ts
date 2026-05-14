import EventEmitter from "node:events";
import { BaseAdapter, BaseApiNetwork } from "./base.ts";
import { BaseApiServer } from "./base.ts";
import type {
  BrowserWindow,
  IpcMain,
  Emitter,
  Message,
  MessageHandler,
} from "./index.ts";

/**
 * Adapter for the backend (main process) API.
 * This class provides access to the API network and server implementations.
 */
class BackendApiAdapter extends BaseAdapter {
  /**
   * Initializes the backend adapter using the provided window and IPC main instance.
   * @param window The Electron BrowserWindow instance.
   * @param ipcMain The Electron ipcMain instance.
   */
  constructor(window: BrowserWindow, ipcMain: IpcMain) {
    super(new BackendApiServer(window, ipcMain), new BackendApiNetwork(window, ipcMain));
  }
}

class NodeEmitter extends EventEmitter implements Emitter {}

class BackendApiNetwork extends BaseApiNetwork {
  private window: BrowserWindow;
  private ipcMain: IpcMain;

  constructor(window: BrowserWindow, ipcMain: IpcMain) {
    super();
    this.window = window;
    this.ipcMain = ipcMain;
    this.listen();
  }

  protected send(data: Message): void {
    void this.window.webContents.send(this.getChannel(), JSON.stringify(data));
  }
  protected createEmitter(): Emitter {
    return new NodeEmitter();
  }
  protected override listen(): void {
    super.listen(this.ipcMain.on.bind(this.ipcMain) as MessageHandler);
  }
}

class BackendApiServer extends BaseApiServer {
  private window: BrowserWindow;
  private ipcMain: IpcMain;

  constructor(window: BrowserWindow, ipcMain: IpcMain) {
    super();
    this.window = window;
    this.ipcMain = ipcMain;
    this.listen();
  }

  protected override listen(): void {
    super.listen(
      this.ipcMain.on.bind(this.ipcMain) as MessageHandler,
      this.window.webContents.send.bind(this.window.webContents),
    );
  }
}

export { BackendApiAdapter };
