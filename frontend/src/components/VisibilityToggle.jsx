import { Eye, EyeOff } from 'lucide-react';

export default function VisibilityToggle({ isPublic, onToggle, size = 16 }) {
  return (
    <button
      onClick={onToggle}
      title={isPublic ? 'Shown on LinkedIn/Indeed exports — click to hide from social media' : 'Hidden from LinkedIn/Indeed exports — still used in AI-generated documents'}
      className={`p-1.5 rounded-md transition-colors ${
        isPublic
          ? 'text-brand hover:bg-brand-light'
          : 'text-gray-400 hover:bg-gray-100'
      }`}
    >
      {isPublic ? <Eye size={size} /> : <EyeOff size={size} />}
    </button>
  );
}
