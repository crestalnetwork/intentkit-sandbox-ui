// Theme Configuration
// This file contains all colors and styling constants used throughout the app
// Modify these values to change the entire app's theme

export const theme = {
  // Core Colors
  colors: {
    // Background colors
    background: {
      primary: '#000000',        // Main background (pitch black)
      secondary: '#000000/80',   // Secondary background with opacity
      tertiary: '#000000/50',    // Tertiary background with opacity
      modal: '#000000/80',       // Modal backdrop
    },
    
    // Primary/Accent color
    primary: {
      main: '#d0ff16',           // Main accent color (lime green)
      hover: '#d0ff16/90',       // Hover state
      light: '#d0ff16/20',       // Light variant
      border: '#d0ff16/30',      // Border variant
      borderHover: '#d0ff16/50', // Border hover variant
      shadow: '#d0ff16/20',      // Shadow variant
    },
    
    // Text colors
    text: {
      primary: '#ffffff',        // Primary text (white)
      secondary: '#d1d5db',      // Secondary text (gray-300)
      tertiary: '#9ca3af',       // Tertiary text (gray-400)
      muted: '#6b7280',          // Muted text (gray-500)
      onPrimary: '#000000',      // Text on primary color backgrounds
    },
    
    // Border colors
    border: {
      primary: '#d0ff16/20',     // Primary border
      secondary: '#374151',      // Secondary border (gray-700)
      tertiary: '#adadad',       // Tertiary border (gray-600)
    },
    
    // State colors
    success: {
      main: '#10b981',           // Success green
      light: '#10b981/20',       // Light success
      border: '#10b981/30',      // Success border
    },
    
    error: {
      main: '#ef4444',           // Error red
      light: '#ef4444/20',       // Light error
      border: '#ef4444/30',      // Error border
    },
    
    warning: {
      main: '#f59e0b',           // Warning amber
      light: '#f59e0b/20',       // Light warning
      border: '#f59e0b/30',      // Warning border
    },
    
    info: {
      main: '#3b82f6',           // Info blue
      light: '#3b82f6/20',       // Light info
      border: '#3b82f6/30',      // Info border
    },
    
    purple: {
      main: '#8b5cf6',           // Purple
      light: '#8b5cf6/20',       // Light purple
      border: '#8b5cf6/30',      // Purple border
    },
  },
  
  // Spacing
  spacing: {
    xs: '0.5rem',    // 8px
    sm: '0.75rem',   // 12px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
  },
  
  // Border radius
  borderRadius: {
    sm: '0.375rem',  // 6px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
  },
  
  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    primary: '0 10px 15px -3px #d0ff16/20',
  },
  
  // Transitions
  transitions: {
    fast: '0.15s ease-in-out',
    normal: '0.2s ease-in-out',
    slow: '0.3s ease-in-out',
  },
  
  // Component-specific styles
  components: {
    button: {
      primary: {
        bg: '#d0ff16',
        text: '#000000',
        hover: '#d0ff16/90',
        shadow: '0 4px 14px 0 #d0ff16/20',
      },
      secondary: {
        bg: '#000000/50',
        text: '#d0ff16',
        border: '#d0ff16/30',
        hover: '#d0ff16/10',
        hoverBorder: '#d0ff16/50',
      },
      danger: {
        bg: '#ef4444/20',
        text: '#f87171',
        border: '#ef4444/30',
        hover: '#ef4444/30',
        hoverBorder: '#ef4444/50',
      },
    },
    
    input: {
      bg: '#000000/50',
      border: '#d0ff16/30',
      text: '#ffffff',
      placeholder: '#9ca3af',
      focus: {
        ring: '#d0ff16/50',
        border: '#d0ff16',
      },
    },
    
    card: {
      bg: '#1f2937',
      border: '#374151',
      hover: {
        bg: '#374151',
        border: '#d0ff16/50',
        shadow: '0 4px 14px 0 rgba(0,0,0,0.1)',
      },
      selected: {
        bg: '#d0ff16',
        border: '#d0ff16',
        text: '#000000',
        shadow: '0 4px 14px 0 #d0ff16/20',
      },
    },
  },
};

// Helper functions for consistent styling
export const getButtonStyles = (variant: 'primary' | 'secondary' | 'danger' = 'primary') => {
  const styles = theme.components.button[variant];
  const borderClass = 'border' in styles ? `border border-[${styles.border}]` : '';
  const hoverBorderClass = 'hoverBorder' in styles ? `hover:border-[${styles.hoverBorder}]` : '';
  
  return `bg-[${styles.bg}] text-[${styles.text}] ${borderClass} hover:bg-[${styles.hover}] ${hoverBorderClass} transition-all duration-200`;
};

export const getInputStyles = () => {
  const styles = theme.components.input;
  return `bg-[${styles.bg}] border border-[${styles.border}] text-[${styles.text}] focus:outline-none focus:ring-2 focus:ring-[${styles.focus.ring}] focus:border-[${styles.focus.border}] transition-all`;
};

export const getCardStyles = (selected: boolean = false) => {
  const styles = theme.components.card;
  if (selected) {
    return `bg-[${styles.selected.bg}] border border-[${styles.selected.border}] text-[${styles.selected.text}] shadow-lg transform scale-[1.02]`;
  }
  return `bg-[${styles.bg}] border border-[${styles.border}] hover:bg-[${styles.hover.bg}] hover:border-[${styles.hover.border}] hover:transform hover:scale-[1.01] transition-all duration-200`;
};

export default theme; 