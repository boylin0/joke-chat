import { createTheme } from "@mui/material";
import { keyframes } from "@mui/system";

const gradientAnimation = keyframes`
    0% { background-position: 0% 0%; }
    25% { background-position: 100% 50%; }
    50% { background-position: 0% 50%; }
    75% { background-position: 100% 50%; }
    100% { background-position: 0% 0%; }
`;

const muiTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0097a7',
    },
    secondary: {
      main: '#039be5',
    },
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
          boxShadow: 'none',
          transition: 'filter 0.1s',
          '&:disabled': {
            filter: 'grayscale(0.8)',
            color: 'rgba(255, 255, 255, 0.9)',
          },
          '&:focus': {
            boxShadow: '0 0 0 0.1rem rgba(0,123,255,.5)',
            filter: 'brightness(1.2)',
            outline: 'none',
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 32,
          padding: '0px 12px',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          borderWidth: '1px',
          '&.Mui-disabled': {
            background: 'gray',
          },
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: `linear-gradient(150deg, #ecedee, transparent 30%),
                       linear-gradient(330deg, rgb(210, 206, 242), transparent 30%),
                       linear-gradient(225deg, #fff0be, #fbdce7, #e2fae1, powderblue)`,
          backgroundSize: '200% 200%',
          animation: `${gradientAnimation} 15s ease infinite`,
        },
      },
    },
  },
});

export default muiTheme;
