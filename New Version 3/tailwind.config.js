/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      'xs': '475px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        // Custom primary colors
        primary: {
          50: '#f0fdf4',  // Lightest Green
          100: '#dcfce7', // Lighter Green
          200: '#bbf7d0', // Light Green
          300: '#86efac', // Medium-Light Green
          400: '#4ade80', // Bright Green
          500: '#22c55e', // Your Core Green Accent <-- Main Accent
          600: '#16a34a', // Darker Green
          700: '#15803d', // Dark Green
          800: '#166534', // Very Dark Green
          900: '#14532d', // Darkest Green
          950: '#052e16', // Near Black Green
        },
        // --- Ensure green matches primary ---
        green: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e', // Your Core Green Accent
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        // --- Shadcn/ui theme colors (aligned with index.css variables) ---
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        
        // --- Theme-specific color extensions ---
        whatsapp: {
          primary: '#00A884',
          secondary: '#25D366',
          accent: '#128C7E',
          background: '#EFEAE2',
          surface: '#FFFFFF',
          text: '#111B21',
          textSecondary: '#667781',
          border: '#D1D7DB',
        },
        forest: {
          primary: '#22C55E',
          secondary: '#16A34A',
          accent: '#84CC16',
          background: '#0F172A',
          surface: 'rgba(34, 197, 94, 0.05)',
          text: '#F8FAFC',
          textSecondary: 'rgba(248, 250, 252, 0.7)',
          border: 'rgba(34, 197, 94, 0.2)',
        },
        ocean: {
          primary: '#ffffff',
          secondary: '#f0f9ff',
          accent: '#0ea5e9',
          background: 'transparent',
          surface: 'rgba(255, 255, 255, 0.15)',
          text: '#1e293b',
          textSecondary: 'rgba(30, 41, 59, 0.8)',
          border: 'rgba(255, 255, 255, 0.3)',
          sidebarBg: '#326080',
        }
      },
      borderRadius: { // Optional: Adjust roundness for shadcn/ui
          lg: "var(--radius)",
          md: "calc(var(--radius) - 2px)",
          sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        hindi: ['Noto Sans Devanagari', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float-gentle': 'float-gentle 6s ease-in-out infinite',
        'breathe': 'breathe 4s ease-in-out infinite',
        'theme-pulse': 'theme-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'float-gentle': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        'breathe': {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.8' },
          '50%': { transform: 'scale(1.05)', opacity: '1' },
        },
        'theme-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
    },
  },
  plugins: [],
}

