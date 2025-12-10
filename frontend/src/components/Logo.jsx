import { Briefcase } from 'lucide-react';

/**
 * Logo component for SmartBiz SA branding
 * Displays a briefcase icon with gradient styling and company name
 * 
 * @param {Object} props
 * @param {boolean} props.darkMode - Whether dark mode is enabled
 */
export function Logo({ darkMode }) {
  return (
    <div className="flex items-center gap-3">
      {/* Icon container with gradient background */}
      <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
        <Briefcase className="w-6 h-6 text-white" />
      </div>
      
      {/* Text content */}
      <div className="flex flex-col">
        <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          SmartBiz SA
        </span>
        <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          AI Business Assistant
        </span>
      </div>
    </div>
  );
}

export default Logo;
