import axios from "redaxios";

describe("using msw", () => {
  it("mocks /scene", async () => {
    const x = await axios.get("/scene/cat");
    console.log(x.data);
  });
});
