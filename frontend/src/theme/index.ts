import { createTheme, ThemeProvider } from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';

// Enhanced color palette with sophisticated gradients
const designTokens = {
  // Primary colors - medical blues and professional tones
  primary: {
    50: '#e3f2fd',
    100: '#bbdefb',
    200: '#90caf9',
    300: '#64b5f6',
    400: '#42a5f5',
    500: '#2196f3',
    600: '#1e88e5',
    700: '#1976d2',
    800: '#1565c0',
    900: '#0d47a1',
  },
  secondary: {
    50: '#fff3e0',
    100: '#ffe0b2',
    200: '#ffcc80',
    300: '#ffb74d',
    400: '#ffa726',
    500: '#ff9800',
    600: '#fb8c00',
    700: '#f57c00',
    800: '#ef6c00',
    900: '#e65100',
  },
  // Medical accent colors
  medical: {
    blue: '#00acc1',
    green: '#4caf50',
    orange: '#ff9800',
    red: '#f44336',
    purple: '#9c27b0',
  },
  // Status colors
  status: {
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336',
    info: '#2196f3',
  },
  // Gradients
  gradients: {
    primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    medical: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    success: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    warning: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    error: 'linear-gradient(135deg, #f83600 0%, #f9d423 100%)',
    glass: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
  },
  // Animation durations and easing
  transitions: {
    fast: '0.15s ease-out',
    normal: '0.3s ease-out',
    slow: '0.5s ease-out',
    smooth: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: '0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
  // Shadow elevations
  shadows: {
    subtle: '0 2px 4px rgba(0,0,0,0.1)',
    medium: '0 4px 12px rgba(0,0,0,0.15)',
    strong: '0 8px 24px rgba(0,0,0,0.2)',
    glow: '0 0 20px rgba(33, 150, 243, 0.3)',
    colored: (color: string) => `0 4px 12px ${color}40`,
  },
  // Border radius variants
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },
};

export const lightTheme: Theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: designTokens.primary[700],
      light: designTokens.primary[400],
      dark: designTokens.primary[900],
      contrastText: '#ffffff',
    },
    secondary: {
      main: designTokens.secondary[700],
      light: designTokens.secondary[400],
      dark: designTokens.secondary[900],
      contrastText: '#ffffff',
    },
    background: {
      default: '#fafbfc',
      paper: '#ffffff',
      gradient: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
    },
    text: {
      primary: '#1a202c',
      secondary: '#4a5568',
      disabled: '#a0aec0',
    },
    info: {
      main: designTokens.medical.blue,
    },
    success: {
      main: designTokens.status.success,
    },
    warning: {
      main: designTokens.status.warning,
    },
    error: {
      main: designTokens.status.error,
    },
    divider: 'rgba(0, 0, 0, 0.08)',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.2,
      background: designTokens.gradients.primary,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
      lineHeight: 1.3,
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
      lineHeight: 1.4,
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.4,
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.5,
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.125rem',
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: designTokens.borderRadius.md,
  },
  transitions: {
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195,
    },
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    },
  },
  shadows: [
    'none',
    designTokens.shadows.subtle,
    designTokens.shadows.medium,
    designTokens.shadows.strong,
    `0 8px 16px rgba(0,0,0,0.1)`,
    `0 12px 24px rgba(0,0,0,0.15)`,
    `0 16px 32px rgba(0,0,0,0.2)`,
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: designTokens.borderRadius.md,
          textTransform: 'none',
          fontWeight: 600,
          padding: '10px 24px',
          transition: designTokens.transitions.smooth,
          boxShadow: designTokens.shadows.subtle,
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: designTokens.shadows.medium,
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        contained: {
          background: designTokens.gradients.primary,
          '&:hover': {
            background: designTokens.gradients.primary,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: designTokens.borderRadius.lg,
          boxShadow: designTokens.shadows.subtle,
          transition: designTokens.transitions.smooth,
          border: '1px solid rgba(0, 0, 0, 0.06)',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: designTokens.shadows.medium,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: designTokens.shadows.subtle,
        },
        elevation2: {
          boxShadow: designTokens.shadows.medium,
        },
        elevation3: {
          boxShadow: designTokens.shadows.strong,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: designTokens.borderRadius.full,
          fontWeight: 500,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: designTokens.borderRadius.md,
            transition: designTokens.transitions.smooth,
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: designTokens.primary[300],
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderWidth: '2px',
            },
          },
        },
      },
    },
  },
  // Custom design tokens for use in components
  custom: {
    gradients: designTokens.gradients,
    transitions: designTokens.transitions,
    shadows: designTokens.shadows,
    borderRadius: designTokens.borderRadius,
    medical: designTokens.medical,
    status: designTokens.status,
  },
});

export const darkTheme: Theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: designTokens.primary[400],
      light: designTokens.primary[300],
      dark: designTokens.primary[600],
      contrastText: '#ffffff',
    },
    secondary: {
      main: designTokens.secondary[400],
      light: designTokens.secondary[300],
      dark: designTokens.secondary[600],
      contrastText: '#ffffff',
    },
    background: {
      default: '#0f1419',
      paper: '#1a1f2e',
      gradient: 'linear-gradient(180deg, #1a1f2e 0%, #0f1419 100%)',
    },
    text: {
      primary: '#f7fafc',
      secondary: '#e2e8f0',
      disabled: '#4a5568',
    },
    info: {
      main: designTokens.medical.blue,
    },
    success: {
      main: designTokens.status.success,
    },
    warning: {
      main: designTokens.status.warning,
    },
    error: {
      main: designTokens.status.error,
    },
    divider: 'rgba(255, 255, 255, 0.12)',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.2,
      background: designTokens.gradients.primary,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
      lineHeight: 1.3,
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
      lineHeight: 1.4,
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.4,
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.5,
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.125rem',
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: designTokens.borderRadius.md,
  },
  transitions: {
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195,
    },
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    },
  },
  shadows: [
    'none',
    '0 2px 4px rgba(0,0,0,0.3)',
    '0 4px 12px rgba(0,0,0,0.4)',
    '0 8px 24px rgba(0,0,0,0.5)',
    `0 8px 16px rgba(0,0,0,0.4)`,
    `0 12px 24px rgba(0,0,0,0.5)`,
    `0 16px 32px rgba(0,0,0,0.6)`,
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: designTokens.borderRadius.md,
          textTransform: 'none',
          fontWeight: 600,
          padding: '10px 24px',
          transition: designTokens.transitions.smooth,
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        contained: {
          background: designTokens.gradients.primary,
          '&:hover': {
            background: designTokens.gradients.primary,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: designTokens.borderRadius.lg,
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          transition: designTokens.transitions.smooth,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(26, 31, 46, 0.8)',
          backdropFilter: 'blur(10px)',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          background: 'rgba(26, 31, 46, 0.8)',
          backdropFilter: 'blur(10px)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: designTokens.borderRadius.full,
          fontWeight: 500,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: designTokens.borderRadius.md,
            transition: designTokens.transitions.smooth,
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: designTokens.primary[600],
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderWidth: '2px',
            },
          },
        },
      },
    },
  },
  // Custom design tokens for use in components
  custom: {
    gradients: designTokens.gradients,
    transitions: designTokens.transitions,
    shadows: designTokens.shadows,
    borderRadius: designTokens.borderRadius,
    medical: designTokens.medical,
    status: designTokens.status,
  },
});
