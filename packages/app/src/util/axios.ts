import redaxios from "redaxios";

const instance = redaxios.create({
  baseURL: "http://localhost:3000/",
});

export default instance;
