import { useState, useEffect } from 'react';
import { Pencil, Check, X, Linkedin, Globe } from 'lucide-react';
import { api } from '../api';

export default function ProfileHeader() {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getProfile().then(p => {
      setProfile(p);
      setForm(p || {});
    });
  }, []);

  async function save() {
    setSaving(true);
    try {
      const updated = await api.updateProfile(form);
      setProfile(updated);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setForm(profile || {});
    setEditing(false);
  }

  if (!profile) return <div className="card p-6 animate-pulse h-36" />;

  return (
    <div className="card p-6">
      <div className="flex items-start gap-4">
        <div className="w-20 h-20 bg-brand rounded-full flex items-center justify-center text-white text-2xl font-bold shrink-0">
          {profile.name ? profile.name.charAt(0).toUpperCase() : '?'}
        </div>
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Full Name</label>
                  <input className="input" value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your Name" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Location</label>
                  <input className="input" value={form.location || ''} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="City, State" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Email</label>
                  <input type="email" className="input" value={form.email || ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@example.com" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Phone</label>
                  <input className="input" value={form.phone || ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+1 (555) 000-0000" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">LinkedIn URL</label>
                  <input className="input" value={form.linkedin_url || ''} onChange={e => setForm(f => ({ ...f, linkedin_url: e.target.value }))} placeholder="linkedin.com/in/..." />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Website</label>
                  <input className="input" value={form.website || ''} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="yoursite.com" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Professional Summary</label>
                <textarea
                  className="textarea"
                  rows={3}
                  value={form.summary || ''}
                  onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
                  placeholder="Brief summary of your professional background..."
                />
              </div>
              <div className="flex gap-2">
                <button onClick={save} disabled={saving} className="btn-primary flex items-center gap-1">
                  <Check size={14} />{saving ? 'Saving…' : 'Save'}
                </button>
                <button onClick={cancel} className="btn-ghost"><X size={16} /></button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{profile.name || <span className="text-gray-400 italic">Add your name</span>}</h1>
                  {profile.location && <p className="text-sm text-gray-500 mt-0.5">{profile.location}</p>}
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                    {profile.email && <span>{profile.email}</span>}
                    {profile.phone && <span>{profile.phone}</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    {profile.linkedin_url && (
                      <a href={profile.linkedin_url.startsWith('http') ? profile.linkedin_url : `https://${profile.linkedin_url}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-brand hover:underline">
                        <Linkedin size={13} /> LinkedIn
                      </a>
                    )}
                    {profile.website && (
                      <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-brand hover:underline">
                        <Globe size={13} /> Website
                      </a>
                    )}
                  </div>
                </div>
                <button onClick={() => setEditing(true)} className="btn-ghost">
                  <Pencil size={16} />
                </button>
              </div>
              {profile.summary && (
                <p className="mt-3 text-sm text-gray-700 leading-relaxed">{profile.summary}</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
