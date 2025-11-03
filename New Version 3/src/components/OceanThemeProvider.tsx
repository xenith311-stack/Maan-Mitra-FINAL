import React, { useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const OceanThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { currentTheme } = useTheme();

  useEffect(() => {
    // Remove all theme classes first
    document.body.classList.remove('ocean-theme', 'forest-theme', 'whatsapp-theme');

    if (currentTheme === 'ocean') {
      // Apply ocean-specific styles to body
      document.body.style.background = 'linear-gradient(135deg, #0a1628 0%, #1e293b 50%, #334155 100%)';
      document.body.style.color = '#f8fafc';
      document.body.classList.add('ocean-theme');

      // Override CSS custom properties for ocean theme
      document.documentElement.style.setProperty('--mm-accent', '#0ea5e9');
      document.documentElement.style.setProperty('--mm-accent-light', '#dbeafe');
      document.documentElement.style.setProperty('--primary', '14 165 233'); // #0ea5e9 in HSL

      // Force override any Vanta background colors
      const vantaElements = document.querySelectorAll('.vanta-background, .vanta-background-local');
      vantaElements.forEach(element => {
        (element as HTMLElement).style.background = `
          radial-gradient(circle at 20% 80%, rgba(14, 165, 233, 0.08) 0%, transparent 60%),
          radial-gradient(circle at 80% 20%, rgba(56, 189, 248, 0.06) 0%, transparent 60%),
          radial-gradient(circle at 40% 40%, rgba(2, 132, 199, 0.04) 0%, transparent 70%),
          linear-gradient(135deg, #0a1628 0%, #1e293b 25%, #334155 50%, #475569 75%, #64748b 100%)
        `;
      });
    } else if (currentTheme === 'forest') {
      // Apply forest-specific styles to body - transparent to show Vanta fog
      document.body.style.background = 'transparent';
      document.body.style.color = '#2d4a2d';
      document.body.classList.add('forest-theme');

      // Update Vanta background for forest theme
      const vantaElements = document.querySelectorAll('.vanta-background, .vanta-background-local');
      vantaElements.forEach(element => {
        (element as HTMLElement).style.background = `
          radial-gradient(circle at 20% 80%, rgba(34, 197, 94, 0.06) 0%, transparent 60%),
          radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.04) 0%, transparent 60%),
          radial-gradient(circle at 40% 40%, rgba(5, 150, 105, 0.03) 0%, transparent 70%),
          linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 253, 249, 0.9) 25%, rgba(240, 253, 244, 0.85) 50%, rgba(236, 253, 245, 0.8) 75%, rgba(209, 250, 229, 0.75) 100%)
        `;
      });
    } else if (currentTheme === 'whatsapp') {
      // Apply WhatsApp theme with doodle pattern
      document.body.style.background = '#EFEAE2 url(/whatsapp-doodle.svg) repeat';
      document.body.style.backgroundSize = '150px 150px';
      document.body.style.color = '#000000';
      document.body.classList.add('whatsapp-theme');

      // Update Vanta background for WhatsApp theme - use doodle pattern
      const vantaElements = document.querySelectorAll('.vanta-background, .vanta-background-local');
      vantaElements.forEach(element => {
        (element as HTMLElement).style.background = '#EFEAE2 url(/whatsapp-doodle.svg) repeat';
        (element as HTMLElement).style.backgroundSize = '150px 150px';
      });
    } else {
      // Default theme - reset custom properties
      document.body.style.background = '';
      document.body.style.color = '';
      document.documentElement.style.setProperty('--mm-accent', '#22c55e');
      document.documentElement.style.setProperty('--mm-accent-light', '#dcf4e3');
      document.documentElement.style.setProperty('--primary', '142.1 76.2% 41.2%');
    }

    return () => {
      document.body.classList.remove('ocean-theme', 'forest-theme', 'whatsapp-theme');
    };
  }, [currentTheme]);

  return <>{children}</>;
};