// Test script to check if API key is loaded
console.log('Testing API key loading...');

// Check if we're in a browser environment
if (typeof window !== 'undefined') {
  console.log('Browser environment detected');
  console.log('VITE_GEMINI_API_KEY:', import.meta.env.VITE_GEMINI_API_KEY);
  console.log('All env vars:', import.meta.env);
} else {
  console.log('Node environment detected');
  console.log('VITE_GEMINI_API_KEY:', process.env.VITE_GEMINI_API_KEY);
}