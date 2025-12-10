import { useState, useContext } from 'react';
import { Sun, Moon, MessageSquare, FileText, BarChart3, Wifi, LogOut } from 'lucide-react';
import { Logo } from './Logo';
import { useDarkMode } from '../hooks/useDarkMode';
import { AuthContext } from '../contexts/AuthContext';

/**
 * Main dashboard layout component with header, sidebar, and content area
 * Manages navigation state and renders the appropriate content component
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.chatComponent - Component to render for Chat tab
 * @param {React.ReactNode} props.invoicesComponent - Component to render for Invoices tab
 * @param {React.ReactNode} props.analyticsComponent - Component to render for Analytics tab
 */
export function DashboardLayout({ chatComponent, invoicesComponent, analyticsComponent }) {
  const [activeTab, setActiveTab] = useState('chat');
  const { darkMode, toggleDarkMode } = useDarkMode();
  const { logout } = useContext(AuthContext);

  const navItems = [
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'chat':
        return chatComponent || <div className="p-4">Chat Component</div>;
      case 'invoices':
        return invoicesComponent || <div className="p-4">Invoices Component</div>;
      case 'analytics':
        return analyticsComponent || <div className="p-4">Analytics Component</div>;
      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-800'}`}>
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-10 h-16 flex items-center justify-between px-4 border-b ${
        darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <Logo darkMode={darkMode} />
        
        <div className="flex items-center gap-4">
          {/* Connected status indicator */}
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-green-500" />
            <span className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              Connected
            </span>
          </div>

          {/* Dark mode toggle */}
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-lg transition-colors ${
              darkMode 
                ? 'hover:bg-slate-700 text-slate-300' 
                : 'hover:bg-slate-100 text-slate-600'
            }`}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Logout button */}
          <button
            onClick={logout}
            className={`p-2 rounded-lg transition-colors ${
              darkMode 
                ? 'hover:bg-slate-700 text-slate-300' 
                : 'hover:bg-slate-100 text-slate-600'
            }`}
            aria-label="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 pt-16">
        {/* Sidebar */}
        <aside className={`fixed left-0 top-16 bottom-0 w-64 border-r ${
          darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
        }`}>
          <nav className="p-4">
            <ul className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : darkMode
                            ? 'text-slate-300 hover:bg-slate-800'
                            : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        {/* Main content area */}
        <main className={`flex-1 ml-64 p-8 ${darkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
