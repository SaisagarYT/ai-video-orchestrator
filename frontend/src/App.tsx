import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { TooltipProvider } from './components/ui/Tooltip';
import { AppRoutes } from './routes';

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <AuthProvider>
        <TooltipProvider delayDuration={200}>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
