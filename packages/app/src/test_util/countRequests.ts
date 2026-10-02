import { onTestFinished } from "vitest";
import { server } from "@math3d/mock-api/node";

/**
 * Counts the requests this test sends with `method` to a path ending in
 * `pathSuffix`. Read `.count` after acting.
 */
const countRequests = (method: string, pathSuffix: string) => {
  const seen = { count: 0 };
  const listener = ({ request }: { request: Request }) => {
    if (
      request.method === method &&
      new URL(request.url).pathname.endsWith(pathSuffix)
    ) {
      seen.count += 1;
    }
  };
  server.events.on("request:start", listener);
  onTestFinished(() => {
    server.events.removeListener("request:start", listener);
  });
  return seen;
};

export default countRequests;
