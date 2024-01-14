import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { handlers } from "../handlers";

/**
 * A request-mocking server for use in NodeJS, e.g., integration tests.
 */
const server = setupServer(...handlers);

const mockResponseOnce = ({
  status,
  method,
  url,
  data,
}: {
  status: number;
  method: "get" | "post" | "patch" | "delete";
  url: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}) => {
  server.use(
    http[method](
      url,
      () => {
        return HttpResponse.json(data, { status });
      },
      { once: true },
    ),
  );
};

export { server, mockResponseOnce };
