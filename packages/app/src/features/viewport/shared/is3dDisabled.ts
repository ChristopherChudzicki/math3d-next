// E2E tests set this flag via Playwright's `disable3d` fixture to skip 3D
// initialization. Most E2E tests only interact with the controls sidebar.
const is3dDisabled = () => localStorage.getItem("disable3dScene") === "true";

export default is3dDisabled;
