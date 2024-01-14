import { http, HttpResponse } from "msw";
import { urls } from "./handlers";
import { seedDb } from "./db";
import { makeItem } from "./factories";
import { server } from "./server";

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

export { seedDb, urls, mockResponseOnce, makeItem, server };
