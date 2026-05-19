import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import VisibilityToggle from './VisibilityToggle';
import { api } from '../api';

const CATEGORIES = ['Technical', 'Soft Skills', 'Tools', 'Languages', 'Frameworks', 'Other'];

export default function SkillsSection() {
  const [skills, setSkills] = useState([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', category: '', proficiency: '' });

  useEffect(() => { api.getSkills().then(setSkills); }, []);

  async function addSkill() {
    if (!form.name.trim()) return;
    const skill = await api.createSkill({ name: form.name.trim(), category: form.category || null, proficiency: form.proficiency ? Number(form.proficiency) : null });
    setSkills(s => [...s, skill]);
    setForm({ name: '', category: '', proficiency: '' });
    setAdding(false);
  }

  async function deleteSkill(id) {
    await api.deleteSkill(id);
    setSkills(s => s.filter(x => x.id !== id));
  }

  async function toggleVisibility(id) {
    const updated = await api.toggleSkillVisibility(id);
    setSkills(s => s.map(x => x.id === id ? updated : x));
  }

  const byCategory = skills.reduce((acc, s) => {
    const cat = s.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title">Skills</h2>
        <button onClick={() => setAdding(a => !a)} className="btn-secondary flex items-center gap-1">
          <Plus size={16} /> Add Skill
        </button>
      </div>

      {adding && (
        <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Skill Name *</label>
              <input
                autoFocus
                className="input"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter') addSkill(); if (e.key === 'Escape') setAdding(false); }}
                placeholder="React, Python, etc."
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Category</label>
              <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                <option value="">Select...</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Proficiency (1–5)</label>
              <select className="input" value={form.proficiency} onChange={e => setForm(f => ({ ...f, proficiency: e.target.value }))}>
                <option value="">—</option>
                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addSkill} className="btn-primary">Add Skill</button>
            <button onClick={() => setAdding(false)} className="btn-ghost px-3 py-1.5 text-sm">Cancel</button>
          </div>
        </div>
      )}

      {skills.length === 0 && !adding && (
        <p className="text-sm text-gray-400 text-center py-6">No skills added yet.</p>
      )}

      {Object.entries(byCategory).map(([cat, catSkills]) => (
        <div key={cat} className="mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{cat}</p>
          <div className="flex flex-wrap gap-2">
            {catSkills.map(skill => (
              <div
                key={skill.id}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm border transition-all ${
                  skill.is_public ? 'bg-brand-light border-brand/30 text-brand' : 'bg-gray-100 border-gray-200 text-gray-500'
                }`}
              >
                <span>{skill.name}</span>
                {skill.proficiency && <span className="text-xs opacity-60">{'★'.repeat(skill.proficiency)}</span>}
                <VisibilityToggle isPublic={skill.is_public} onToggle={() => toggleVisibility(skill.id)} size={13} />
                <button onClick={() => deleteSkill(skill.id)} className="ml-0.5 text-current opacity-50 hover:opacity-100">
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
