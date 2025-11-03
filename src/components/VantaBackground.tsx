import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import "./VantaBackground.css";

export default function VantaBackground({ variant = 'fixed' as 'fixed' | 'local' }) {
  const { currentTheme } = useTheme();
  const vantaRef = useRef<HTMLDivElement>(null);
  const vantaEffect = useRef<any>(null);
  const [fallbackStyle, setFallbackStyle] = useState({});

  useEffect(() => {
    // Cleanup previous effect
    if (vantaEffect.current) {
      vantaEffect.current.destroy();
      vantaEffect.current = null;
    }

    const initVantaEffect = async () => {
      try {
        if (currentTheme === 'ocean' || currentTheme === 'forest') {
          // Dynamically import Vanta.js for performance
          const [THREE, { default: FOG }] = await Promise.all([
            import('three'),
            import('vanta/dist/vanta.fog.min')
          ]);

          if (vantaRef.current) {
            if (currentTheme === 'ocean') {
              // Ocean theme - Vanta.js FOG effect with ocean-like configurations
              vantaEffect.current = FOG({
                el: vantaRef.current,
                THREE: THREE,
                minHeight: 200.0,
                minWidth: 200.0,
                highlightColor: 0xd4e8f7,    // Sky blue highlights (#d4e8f7)
                midtoneColor: 0xffffff,      // Pure white (#ffffff)
                lowlightColor: 0xb5d2e6,     // Light blue (#b5d2e6)
                baseColor: 0xb5d2e6,         // Sidebar blue as base (#b5d2e6)
                blurFactor: 0.35,            // High blur for dreamy cloud effect
                speed: 0.8,                  // Very slow, peaceful movement
                zoom: 1.5                    // Zoomed in for better cloud detail
              });
            } else if (currentTheme === 'forest') {
              // Forest theme - FOG effect with natural green tones
              vantaEffect.current = FOG({
                el: vantaRef.current,
                THREE: THREE,
                minHeight: 200.0,
                minWidth: 200.0,
                highlightColor: 0xf2f0e9,   // Light cream highlights
                midtoneColor: 0xc2d4c8,     // Soft sage green midtones
                lowlightColor: 0xcfdcd1,    // Pale mint green lowlights
                baseColor: 0xc9d7cb,        // Base sage green
                blurFactor: 0.2,            // Moderate blur for natural fog
                speed: 1.5,                 // Gentle movement like forest breeze
                zoom: 0.8                   // Wider view for forest atmosphere
              });
            }
          }
        } else {
          // For WhatsApp theme, use CSS background
          setFallbackStyle({
            background: '#EFEAE2 url(/whatsapp-doodle.svg) repeat',
            backgroundSize: '150px 150px'
          });
        }
      } catch (error) {
        console.warn('Vanta.js failed to load, using fallback background:', error);
        // Set fallback backgrounds
        if (currentTheme === 'ocean') {
          setFallbackStyle({
            background: 'linear-gradient(135deg, #4a90a4 0%, #5a9fb5 50%, #87ceeb 100%)'
          });
        } else if (currentTheme === 'forest') {
          setFallbackStyle({
            background: 'linear-gradient(135deg, #c9d7cb 0%, #c2d4c8 50%, #cfdcd1 100%)'
          });
        } else if (currentTheme === 'whatsapp') {
          setFallbackStyle({
            background: '#EFEAE2 url(/whatsapp-doodle.svg) repeat',
            backgroundSize: '150px 150px'
          });
        }
      }
    };

    initVantaEffect();

    // Cleanup on unmount or theme change
    return () => {
      if (vantaEffect.current) {
        vantaEffect.current.destroy();
        vantaEffect.current = null;
      }
    };
  }, [currentTheme]);

  return (
    <div 
      ref={vantaRef}
      className={`${variant === 'fixed' ? "vanta-background" : "vanta-background-local"} ${
        !vantaEffect.current && currentTheme === 'ocean' ? 'fallback-ocean' : 
        !vantaEffect.current && currentTheme === 'forest' ? 'fallback-forest' : ''
      }`}
      style={!vantaEffect.current ? fallbackStyle : {}}
    />
  );
}

