import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#1890ff",
    },
    secondary: {
      main: "#8c8c8c",
    },
    text: {
      primary: "#434343",
    },
  },
  components: {
    MuiLink: {
      styleOverrides: {
        root: {
          textDecoration: "none",
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          "> p:first-child": {
            marginTop: 0,
          },
          "> p:last-child": {
            marginBottom: 0,
          },
        },
      },
    },
  },
});

export { theme };
