import redaxios from "redaxios";

const instance = redaxios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL as string,
});

export default instance;
