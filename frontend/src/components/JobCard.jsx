import { useState } from 'react';
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import BulletItem from './BulletItem';
import VisibilityToggle from './VisibilityToggle';

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function toInputDate(d) {
  if (!d) return '';
  return new Date(d).toISOString().split('T')[0];
}

export default function JobCard({ job, onUpdate, onDelete, onToggleVisibility, onAddBullet, onUpdateBullet, onDeleteBullet, onToggleBulletVisibility }) {
  const [editing, setEditing] = useState(false);
  const [addingBullet, setAddingBullet] = useState(false);
  const [newBullet, setNewBullet] = useState('');
  const [form, setForm] = useState({
    company: job.company,
    title: job.title,
    location: job.location || '',
    start_date: toInputDate(job.start_date),
    end_date: toInputDate(job.end_date),
    is_current: job.is_current || false,
  });

  function saveJob() {
    onUpdate(job.id, {
      ...form,
      start_date: form.start_date || null,
      end_date: form.is_current ? null : (form.end_date || null),
      is_public: job.is_public,
    });
    setEditing(false);
  }

  async function addBullet() {
    if (!newBullet.trim()) return;
    await onAddBullet(job.id, newBullet.trim());
    setNewBullet('');
    setAddingBullet(false);
  }

  return (
    <div className={`card p-4 ${!job.is_public ? 'border-dashed border-gray-300' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs font-bold shrink-0">
          {job.company.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input className="input" placeholder="Job Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                <input className="input" placeholder="Company" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
              </div>
              <input className="input" placeholder="Location" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Start Date</label>
                  <input type="date" className="input" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">End Date</label>
                  <input type="date" className="input" value={form.end_date} disabled={form.is_current} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_current} onChange={e => setForm(f => ({ ...f, is_current: e.target.checked }))} />
                Currently working here
              </label>
              <div className="flex gap-2">
                <button onClick={saveJob} className="btn-primary flex items-center gap-1"><Check size={14} />Save</button>
                <button onClick={() => setEditing(false)} className="btn-ghost"><X size={16} /></button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{job.title}</h3>
                  <p className="text-sm text-gray-600">{job.company}{job.location ? ` · ${job.location}` : ''}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatDate(job.start_date)}{job.start_date ? ' – ' : ''}{job.is_current ? 'Present' : formatDate(job.end_date)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <VisibilityToggle isPublic={job.is_public} onToggle={() => onToggleVisibility(job.id)} />
                  <button onClick={() => setEditing(true)} className="btn-ghost"><Pencil size={15} /></button>
                  <button onClick={() => onDelete(job.id)} className="btn-ghost text-red-400 hover:text-red-600"><Trash2 size={15} /></button>
                </div>
              </div>

              <div className="mt-3 space-y-0.5">
                {(job.bullets || []).map(b => (
                  <BulletItem
                    key={b.id}
                    bullet={b}
                    jobId={job.id}
                    onUpdate={onUpdateBullet}
                    onDelete={onDeleteBullet}
                    onToggleVisibility={onToggleBulletVisibility}
                  />
                ))}
              </div>

              {addingBullet ? (
                <div className="mt-2 flex items-start gap-1">
                  <span className="text-gray-400 mt-2.5 select-none">•</span>
                  <textarea
                    autoFocus
                    value={newBullet}
                    onChange={e => setNewBullet(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addBullet(); } if (e.key === 'Escape') { setAddingBullet(false); setNewBullet(''); } }}
                    placeholder="Describe an achievement or responsibility..."
                    rows={2}
                    className="textarea flex-1 text-sm"
                  />
                  <div className="flex flex-col gap-1 mt-1">
                    <button onClick={addBullet} className="btn-ghost text-green-600"><Check size={16} /></button>
                    <button onClick={() => { setAddingBullet(false); setNewBullet(''); }} className="btn-ghost"><X size={16} /></button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAddingBullet(true)}
                  className="mt-2 flex items-center gap-1 text-xs text-brand hover:underline"
                >
                  <Plus size={13} /> Add bullet
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
