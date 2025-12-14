import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { clearAllExpiredCache } from './hooks/useCachedData';

// Clear expired cache entries on app initialization
clearAllExpiredCache();

createRoot(document.getElementById("root")!).render(<App />);