import "../src/globals.css";
import "./preview.css";
import type { Preview } from "@storybook/react-vite";
import withRouter from "./withRouter";

const preview: Preview = { decorators: [withRouter] };

export default preview;
