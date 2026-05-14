import { BaseAdapter, BaseApiServer } from "./base.ts";
import { BaseApiNetwork } from "./base.ts";
import type { Emitter, IpcRenderer, Message, MessageHandler } from "./index.ts";

/**
 * Adapter for the frontend (renderer process) API.
 * This class provides access to the API network and server implementations.
 */
class FrontendApiAdapter extends BaseAdapter {
  /**
   * Initializes the frontend adapter using the provided IPC renderer instance.
   * @param ipcRenderer The Electron ipcRenderer instance used for communication.
   */
  constructor(ipcRenderer: IpcRenderer) {
    super(new FrontendApiServer(ipcRenderer), new FrontendApiNetwork(ipcRenderer));
  }
}

class FrontendApiServer extends BaseApiServer {
  private ipcRenderer: IpcRenderer;

  constructor(ipcRenderer: IpcRenderer) {
    super();
    this.ipcRenderer = ipcRenderer;
    this.listen();
  }

  protected override listen(): void {
    super.listen(
      this.ipcRenderer.on.bind(this.ipcRenderer) as MessageHandler,
      this.ipcRenderer.send.bind(this.ipcRenderer),
    );
  }
}

class BrowserEmitter extends EventTarget implements Emitter {
  on(uuid: string, callback: EventListener) {
    this.addEventListener(uuid, callback);
  }

  emit(uuid: string, data: Record<string, unknown>) {
    this.dispatchEvent(new CustomEvent(uuid, { detail: data }));
  }

  off(uuid: string, callback: EventListener) {
    this.removeEventListener(uuid, callback);
  }
}

class FrontendApiNetwork extends BaseApiNetwork {
  private ipcRenderer: IpcRenderer;

  constructor(ipcRenderer: IpcRenderer) {
    super();
    this.ipcRenderer = ipcRenderer;
    this.listen();
  }

  protected send(data: Message): void {
    this.ipcRenderer.send(this.getChannel(), JSON.stringify(data));
  }

  protected createEmitter(): Emitter {
    return new BrowserEmitter();
  }

  protected override listen(): void {
    super.listen(this.ipcRenderer.on.bind(this.ipcRenderer) as MessageHandler);
  }
}

export { FrontendApiAdapter };
