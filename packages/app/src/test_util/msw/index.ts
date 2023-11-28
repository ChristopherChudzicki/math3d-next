import { rest } from "msw";
import { urls } from "./handlers";
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
    rest[method](url, (req, res, ctx) => {
      return res.once(ctx.status(status), ctx.json(data));
    }),
  );
};

export { server, urls, mockResponseOnce };
