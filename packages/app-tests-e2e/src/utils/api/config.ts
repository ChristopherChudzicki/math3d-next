import env from "@/env";
import rootAxios from "axios";

const axios = rootAxios.create({
  baseURL: env.TEST_API_URL,
  withCredentials: true,
});

export { axios };
