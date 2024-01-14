/**
 * See https://mswjs.io/docs/migrations/1.x-to-2.x/#requestresponsetextencoder-is-not-defined-jest
 *
 * MSW says this should not be an issue for vitest, but I was getting empty
 * response bodies without this.
 */

import { TextDecoder, TextEncoder } from "node:util";
import { Blob, File } from "node:buffer";
import { fetch, Headers, FormData, Request, Response } from "undici";

Object.defineProperties(globalThis, {
  TextDecoder: { value: TextDecoder },
  TextEncoder: { value: TextEncoder },
});

Object.defineProperties(globalThis, {
  fetch: { value: fetch, writable: true },
  Blob: { value: Blob },
  File: { value: File },
  Headers: { value: Headers },
  FormData: { value: FormData },
  Request: { value: Request },
  Response: { value: Response },
});
