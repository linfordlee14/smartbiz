import { useContext } from 'react';
import { DarkModeProvider } from './contexts/DarkModeContext';
import { AuthProvider, AuthContext } from './contexts/AuthContext';
import { useDarkMode } from './hooks/useDarkMode';
import { 
  DashboardLayout, 
  ChatInterface, 
  InvoiceGenerator, 
  AnalyticsDashboard,
  Login
} from './components';
import './App.css';

/**
 * Dashboard content component that uses dark mode context
 * Renders DashboardLayout with all child components wired up
 */
function DashboardContent() {
  const { darkMode } = useDarkMode();

  return (
    <DashboardLayout
      chatComponent={<ChatInterface darkMode={darkMode} />}
      invoicesComponent={<InvoiceGenerator darkMode={darkMode} />}
      analyticsComponent={<AnalyticsDashboard darkMode={darkMode} />}
    />
  );
}

/**
 * Inner app component that handles authentication-based routing
 * Renders Login when unauthenticated, Dashboard when authenticated
 * Requirements: 1.1, 6.1, 6.2, 6.3
 */
function AppContent() {
  const { isAuthenticated } = useContext(AuthContext);

  return isAuthenticated ? <DashboardContent /> : <Login />;
}

/**
 * Root App component
 * Provides auth and dark mode contexts at app level
 * Conditionally renders Login or Dashboard based on authentication state
 */
function App() {
  return (
    <AuthProvider>
      <DarkModeProvider>
        <AppContent />
      </DarkModeProvider>
    </AuthProvider>
  );
}

export default App;
