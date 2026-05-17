import type {
  RequestHandler,
  RegisteredListener,
  ApiNetwork,
  ApiServer,
  Emitter,
  MessageListener,
  Message,
  MessageHeader,
  MessageSender,
  MessageHandler,
  DataPromise,
  AsyncDataCallback,
  DataCallback,
  ErrorCallback,
} from "./index.d.ts";
import { getRandomString } from "./lib.ts";

/**
 * Abstract base adapter that provides access to the network and server components.
 */
class BaseAdapter {
  protected server: BaseApiServer;
  protected network: BaseApiNetwork;

  /**
   * Initializes the base adapter.
   * @param server The server API instance.
   * @param network The network API instance.
   */
  constructor(server: BaseApiServer, network: BaseApiNetwork) {
    this.server = server;
    this.network = network;
  }

  /**
   * Returns the network API.
   * @returns The network API interface.
   */
  public getNetwork(): ApiNetwork {
    return {
      fetch: this.network.fetch.bind(this.network),
      signal: this.network.signal.bind(this.network),
      setDefaultTimeout: this.network.setDefaultTimeout.bind(this.network),
      getDefaultTimeout: this.network.getDefaultTimeout.bind(this.network),
    };
  }

  /**
   * Returns the server API.
   * @returns The server API interface.
   */
  public getServer(): ApiServer {
    return {
      init: this.server.init.bind(this.server),
      addListener: this.server.addListener.bind(this.server),
      removeListener: this.server.removeListener.bind(this.server),
      removeAllListeners: this.server.removeAllListeners.bind(this.server),
    };
  }
}

/**
 * Base API class that defines common constants and defaults.
 */
class BaseApi {
  private static readonly CHANNEL = "default-channel";
  private defaultTimeout = 1000;

  /**
   * Retrieves the default IPC channel name.
   * @returns The default IPC channel.
   */
  protected getChannel() {
    return BaseApi.CHANNEL;
  }

  /**
   * Retrieves the current default timeout for requests.
   * @returns The default timeout in milliseconds.
   */
  public getDefaultTimeout() {
    return this.defaultTimeout;
  }

  /**
   * Sets a new default timeout for requests.
   * @param defaultTimeout The timeout in milliseconds.
   */
  public setDefaultTimeout(defaultTimeout: number) {
    this.defaultTimeout = defaultTimeout;
  }
}

/**
 * Base implementation of the API network for sending requests and signals.
 */
abstract class BaseApiNetwork extends BaseApi implements ApiNetwork {
  protected pendingRequests = new Map<string, AsyncDataCallback>();

  protected abstract send(data: Message): void;

  protected abstract createEmitter(): Emitter;

  protected listen(onMessage: MessageHandler): void {
    onMessage(this.getChannel(), (_: unknown, message: unknown) => {
      const data = JSON.parse(message as string) as Message;

      if (data.header.type !== "response") {
        return;
      }

      const pending = this.pendingRequests.get(data.header.id);
      if (pending && pending instanceof Function) {
        this.pendingRequests.delete(data.header.id);
        void pending(data.error ? { error: data.error } : data.data);
      }
    });
  }

  protected generateMessageId(): string {
    let id = "message-id";

    do {
      if (id.length > 100) {
        throw new Error("Could not generate a unique ID after multiple attempts.");
      }
      id = `${id}-${getRandomString()}`;
    } while (this.pendingRequests.has(id));

    return id;
  }

  /**
   * Fetches data from a specific endpoint.
   * @param path The endpoint path.
   * @param data The payload data.
   * @param options Optional configuration parameters, such as timeout.
   * @param onSuccess Callback for when the request succeeds.
   * @param onError Callback for when the request fails.
   * @returns A promise of the result if no callbacks are provided, or a callback type.
   */
  public fetch<T extends null | DataCallback>(
    path: string,
    data: Record<string, unknown>,
    options: Record<string, unknown> | null = null,
    onSuccess: T | null = null,
    onError: ErrorCallback | null = null,
  ): T extends null ? DataPromise : AsyncDataCallback {
    const messageId = this.generateMessageId();
    const timeout: number = (options?.timeout ?? this.getDefaultTimeout()) as number;
    const header: MessageHeader = {
      id: messageId,
      channel: this.getChannel(),
      type: "request",
      timeout: timeout,
    };

    if (onSuccess !== null) {
      const responseHandler: AsyncDataCallback = (res) => {
        return new Promise((resolve, reject) => {
          this.pendingRequests.delete(messageId);
          if (res.error) {
            const errorObj = new Error(JSON.stringify(res.error));
            if (onError) {
              onError(errorObj);
            } else {
              reject(errorObj);
            }
          } else {
            onSuccess(res);
            resolve(res);
          }
        });
      };

      this.pendingRequests.set(messageId, responseHandler);

      setTimeout(() => {
        if (this.pendingRequests.has(messageId) && onError !== null) {
          onError(new Error("Request timeout"));
        }
        this.pendingRequests.delete(messageId);
      }, timeout);

      this.send({ header, path, data });

      return responseHandler as T extends null ? DataPromise : AsyncDataCallback;
    } else {
      const emitter = this.createEmitter();

      const responseResolver: AsyncDataCallback = (data) => {
        emitter.emit(messageId, data);
        return Promise.resolve(data);
      };
      this.pendingRequests.set(messageId, responseResolver);

      this.send({ header, path, data });

      return new Promise((resolve, reject) => {
        const emitterCallback = (data: Record<string, unknown>) => {
          emitter.off(messageId, emitterCallback as unknown as EventListener);
          const result = (data as { detail?: Record<string, unknown> }).detail ?? data;
          this.pendingRequests.delete(messageId);

          if (result.error) {
            reject(new Error(JSON.stringify(result.error)));
          } else {
            resolve(result);
          }
        };

        emitter.on(messageId, emitterCallback as unknown as EventListener);

        setTimeout(() => {
          if (this.pendingRequests.get(messageId)) {
            this.pendingRequests.delete(messageId);
            emitter.off(messageId, emitterCallback as unknown as EventListener);
            reject(new Error("Request timeout"));
          }
        }, timeout);
      }) as T extends null ? DataPromise : AsyncDataCallback;
    }
  }

  /**
   * Sends a signal to an endpoint without expecting a response.
   * @param path The endpoint path.
   * @param data The payload data.
   */
  public signal(path: string, data: Record<string, unknown>): void {
    const header: MessageHeader = {
      id: this.generateMessageId(),
      channel: this.getChannel(),
      type: "signal",
      timeout: 0,
    };

    this.send({ header, path, data });
  }
}

/**
 * Base implementation of the API server for handling incoming requests and signals.
 */
abstract class BaseApiServer extends BaseApi implements ApiServer {
  protected handlers = new Map<string, RequestHandler>();
  protected listeners = new Map<string, RegisteredListener[]>();

  protected listen(onMessage: MessageHandler, send: MessageSender): void {
    onMessage(this.getChannel(), (_: unknown, message: unknown) => {
      const data = JSON.parse(message as string) as Message;

      if (data.header.type === "response") {
        return;
      }

      const handler = this.handlers.get(data.path);

      if (!(handler instanceof Function)) {
        return void send(
          this.getChannel(),
          JSON.stringify({
            ...data,
            header: { ...data.header, type: "response" },
            data: {},
            error: { code: 404, message: "Not found", path: data.path },
          }),
        );
      }

      const activeListeners = this.listeners.get(data.path) ?? [];

      const promiseList: Promise<void>[] = [];
      activeListeners.forEach((f: RegisteredListener) => {
        promiseList.push(
          new Promise((resolve) => {
            resolve(f.handler(structuredClone(data.data)));
          }),
        );
      });

      const sendResponse = (response: Record<string, unknown>): void => {
        if (data.header.type === "signal") {
          return;
        }
        void send(
          this.getChannel(),
          JSON.stringify({
            ...data,
            header: { ...data.header, type: "response" },
            data: response,
          }),
        );
      };

      Promise.all(promiseList)
        .catch((_: unknown) => null)
        .finally(() => {
          void handler(data.data, sendResponse);
        });
    });
  }

  /**
   * Initializes the server with the given endpoint handlers.
   * @param handlers A mapping of endpoint paths to request handlers.
   */
  public init(handlers: Record<string, RequestHandler>): void {
    this.handlers = new Map(Object.entries(handlers));
  }

  protected generateListenerId(used: string[] = []): string {
    let id = "listener-id";

    do {
      if (id.length > 100) {
        throw new Error("Could not generate a unique ID after multiple attempts.");
      }
      id = `${id}-${getRandomString()}`;
    } while (used.includes(id));

    return id;
  }

  /**
   * Registers a listener for a specific endpoint path.
   * @param path The endpoint path.
   * @param listener The listener function to handle incoming messages.
   * @returns A unique identifier for the registered listener.
   */
  addListener(path: string, listener: MessageListener): string {
    const activeListeners = this.listeners.get(path) ?? [];
    const id = this.generateListenerId(activeListeners.map((item) => item.id));
    activeListeners.push({ id, handler: listener });
    this.listeners.set(path, activeListeners);
    return id;
  }

  /**
   * Removes a specific listener by its identifier.
   * @param path The endpoint path the listener is registered on.
   * @param id The unique identifier of the listener.
   */
  removeListener(path: string, id: string): void {
    const activeListeners = this.listeners.get(path) ?? [];
    const updatedListeners = activeListeners.filter((item) => item.id !== id);
    this.listeners.set(path, updatedListeners);
  }

  /**
   * Removes all registered listeners for a specific endpoint path.
   * @param path The endpoint path.
   */
  removeAllListeners(path: string): void {
    this.listeners.delete(path);
  }
}

export { BaseApi, BaseAdapter, BaseApiNetwork, BaseApiServer };
