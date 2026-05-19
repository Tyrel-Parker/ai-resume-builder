import { User, FileText } from 'lucide-react';

export default function Header({ tab, onTabChange }) {
  const tabs = [
    { id: 'profile', label: 'Profile', Icon: User },
    { id: 'builder', label: 'Resume Builder', Icon: FileText },
  ];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center gap-8 h-14">
          <span className="font-bold text-brand text-lg tracking-tight">ResumeAI</span>
          <nav className="flex gap-1">
            {tabs.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => onTabChange(id)}
                className={`flex items-center gap-1.5 px-4 py-4 text-sm font-medium border-b-2 transition-colors ${
                  tab === id
                    ? 'border-brand text-brand'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
