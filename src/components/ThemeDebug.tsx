import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

export const ThemeDebug: React.FC = () => {
  const { currentTheme, themes } = useTheme();

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-black/80 text-white rounded-lg text-xs max-w-xs">
      <h4 className="font-bold mb-2">Theme Debug Info</h4>
      <div className="space-y-1">
        <div>Current Theme: <span className="font-mono">{currentTheme}</span></div>
        <div>Body Classes: <span className="font-mono">{document.body.className}</span></div>
        <div>Body Background: <span className="font-mono">{document.body.style.background}</span></div>
        <div>Body Color: <span className="font-mono">{document.body.style.color}</span></div>
        <div>Available Themes: {Object.keys(themes).join(', ')}</div>
      </div>
    </div>
  );
};