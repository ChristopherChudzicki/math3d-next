import axios from "redaxios";

describe("using msw", () => {
  it("mocks /scene", async () => {
    const x = await axios.get("/scenes/cat");
    console.log(x.data);
  });
});
