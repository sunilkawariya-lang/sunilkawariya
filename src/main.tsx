import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { FirebaseProvider } from './contexts/FirebaseContext';
import ErrorBoundary from './components/ErrorBoundary';
import { safeStringify } from './lib/errorHandler';

// Patch console methods to handle circular structures safely
// This prevents "Converting circular structure to JSON" errors when environments intercept logs
const patchConsole = () => {
  const methods: (keyof Console)[] = ['error', 'warn', 'log', 'info'];
  methods.forEach(method => {
    const original = console[method];
    (console[method] as any) = (...args: any[]) => {
      const safeArgs = args.map(arg => {
        if (typeof arg === 'object' && arg !== null) {
          // If it's already an Error, we might want to keep it as is for stack traces
          // but some environments still try to stringify it.
          // Let's use safeStringify to be sure.
          try {
            // Test if it's already safe
            JSON.stringify(arg);
            return arg;
          } catch (e) {
            return safeStringify(arg);
          }
        }
        return arg;
      });
      original.apply(console, safeArgs);
    };
  });
};

patchConsole();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <FirebaseProvider>
        <App />
      </FirebaseProvider>
    </ErrorBoundary>
  </StrictMode>,
);
