import axios from "redaxios";
import { sceneIds } from "test_util";

describe("using msw", () => {
  it("mocks /scene", async () => {
    expect(1 + 1).toBe(2);
    const { data } = await axios.get(`/scenes/${sceneIds.testFolders}`);
    console.log(data);
  });
});
