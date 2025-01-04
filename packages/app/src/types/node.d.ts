/// <reference types="vite-plugin-compile-time/client" />

export {};

declare global {
  namespace NodeJS {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface, @typescript-eslint/naming-convention
    interface Global {}
  }
}
