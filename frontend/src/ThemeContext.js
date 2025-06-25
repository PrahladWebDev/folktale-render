import React, { createContext, useState, useEffect } from 'react';

// Create the Theme Context
export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode((prevMode) => {
      const newMode = !prevMode;
      // Update class on root element
      document.body.classList.toggle('dark-mode', newMode);
      // Save to localStorage
      localStorage.setItem('theme', newMode ? 'dark' : 'light');
      return newMode;
    });
  };

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.body.classList.add('dark-mode');
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
