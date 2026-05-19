import { useState } from 'react';
import { Trash2, Check, X } from 'lucide-react';
import VisibilityToggle from './VisibilityToggle';

export default function BulletItem({ bullet, jobId, onUpdate, onDelete, onToggleVisibility }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(bullet.content);

  function save() {
    if (value.trim() && value.trim() !== bullet.content) {
      onUpdate(jobId, bullet.id, value.trim());
    }
    setEditing(false);
  }

  function cancel() {
    setValue(bullet.content);
    setEditing(false);
  }

  return (
    <div className={`flex items-start gap-2 group py-1 px-2 rounded-lg ${bullet.is_public ? '' : 'border-l-2 border-gray-200 ml-1'}`}>
      <span className="text-gray-400 mt-1 select-none">•</span>
      {editing ? (
        <div className="flex-1 flex items-start gap-1">
          <textarea
            autoFocus
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); save(); } if (e.key === 'Escape') cancel(); }}
            rows={2}
            className="textarea flex-1 text-sm"
          />
          <button onClick={save} className="btn-ghost text-green-600 mt-0.5"><Check size={16} /></button>
          <button onClick={cancel} className="btn-ghost text-gray-400 mt-0.5"><X size={16} /></button>
        </div>
      ) : (
        <span
          onClick={() => setEditing(true)}
          className="flex-1 text-sm text-gray-700 cursor-pointer hover:text-gray-900 leading-relaxed"
          title="Click to edit"
        >
          {bullet.content}
        </span>
      )}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-auto shrink-0">
        <VisibilityToggle isPublic={bullet.is_public} onToggle={() => onToggleVisibility(jobId, bullet.id)} />
        <button onClick={() => onDelete(jobId, bullet.id)} className="btn-ghost text-red-400 hover:text-red-600">
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}
