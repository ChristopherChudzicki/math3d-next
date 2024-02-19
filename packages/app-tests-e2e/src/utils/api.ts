import { Configuration } from "@math3d/api";
import env from "@/env";
import rootAxios from "axios";

const axios = rootAxios.create({
  baseURL: env.TEST_API_URL,
});

const getConfig = (authToken: string | null) =>
  new Configuration({
    apiKey: () => {
      return authToken ? `Token ${authToken}` : "";
    },
    basePath: env.TEST_API_URL,
  });

export { getConfig, axios };
