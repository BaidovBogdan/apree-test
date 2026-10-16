import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#F4019E', contrastText: '#0A0B0D' },
    background: { default: '#0A0B0D', paper: '#111316' },
    text: { primary: '#FFFFFF', secondary: '#B3B3B3' },
    divider: '#2A2E31',
    error: { main: '#FF8998' },
    success: { main: '#71D8A3' },
    warning: { main: '#F0C477' },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: 'Montserrat, Arial, sans-serif',
    fontSize: 14,
    button: { textTransform: 'none', fontWeight: 700 },
    h1: { fontSize: '2.75rem', lineHeight: 1.2, letterSpacing: '-0.045em', fontWeight: 800 },
    h2: { fontSize: '1.125rem', fontWeight: 700 },
    h3: { fontSize: '1rem', fontWeight: 600 },
  },
  components: {
    MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: {
      root: { minHeight: 44, borderRadius: 30, paddingInline: 20 },
      containedPrimary: { '&:hover': { backgroundColor: '#FF3BB8' } },
    } },
    MuiIconButton: { styleOverrides: { root: { minWidth: 40, minHeight: 40 } } },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiDialog: { styleOverrides: { paper: { border: '1px solid #2A2E31', borderRadius: 20 } } },
    MuiDialogTitle: { styleOverrides: { root: { fontWeight: 700, padding: '24px 24px 16px' } } },
    MuiDialogActions: { styleOverrides: { root: { padding: '16px 24px 24px', gap: 8 } } },
    MuiOutlinedInput: { styleOverrides: { root: { background: '#191C20', borderRadius: 10 } } },
    MuiChip: { styleOverrides: { root: { fontWeight: 600, fontSize: 11 } } },
    MuiTooltip: { styleOverrides: { tooltip: { background: '#2A2E31', color: '#FFFFFF', fontSize: 12 } } },
    MuiMenu: { styleOverrides: { paper: { border: '1px solid #2A2E31' } } },
  },
});
