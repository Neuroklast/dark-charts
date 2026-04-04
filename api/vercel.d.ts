declare module '@vercel/node' {
  import { IncomingMessage, ServerResponse } from 'http';

  export interface VercelRequest extends IncomingMessage {
    query: { [key: string]: string | string[] };
    cookies: { [key: string]: string };
    body: any;
  }

  export interface VercelResponse extends ServerResponse {
    status(code: number): VercelResponse;
    json(body: any): VercelResponse;
    send(body: any): void;
    redirect(url: string): VercelResponse;
    redirect(statusCode: number, url: string): VercelResponse;
    setHeader(name: string, value: string | string[]): VercelResponse;
  }

  export type VercelRequestHandler = (
    req: VercelRequest,
    res: VercelResponse
  ) => void | Promise<void>;
}
