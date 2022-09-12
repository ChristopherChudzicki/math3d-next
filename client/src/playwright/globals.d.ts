import type { SeedDb } from "@/test_util/msw/db";

declare global {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  interface Window {
    /**
     * Defaults to `faults`. If `true`, React App will not mount until
     * `$pw.doneSeeding` is called.
     */
    $pwCustomSeed: boolean;
    /**
     * Playwright helpers.
     */
    $pw: {
      /**
       * Seed the MSW database with data.
       * Accessing any properties of `$pw.seedDb` after `$pw.doneSeeding` has
       * been called will throw an error.
       */
      seedDb: SeedDb;
      /**
       * When called, React App will mount and `$pw.seedDb` becomes
       * inaccessible.
       */
      doneSeeding: () => void;
    };
  }
}
