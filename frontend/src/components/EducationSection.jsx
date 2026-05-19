import { useState, useEffect } from 'react';
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import VisibilityToggle from './VisibilityToggle';
import { api } from '../api';

function toInputDate(d) {
  if (!d) return '';
  return new Date(d).toISOString().split('T')[0];
}

function formatYear(d) {
  if (!d) return '';
  return new Date(d).getFullYear();
}

const emptyForm = { institution: '', degree: '', field_of_study: '', start_date: '', end_date: '' };

export default function EducationSection() {
  const [education, setEducation] = useState([]);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { api.getEducation().then(setEducation); }, []);

  async function addEdu() {
    if (!form.institution.trim()) return;
    const edu = await api.createEducation({ ...form, start_date: form.start_date || null, end_date: form.end_date || null });
    setEducation(e => [edu, ...e]);
    setForm(emptyForm);
    setAdding(false);
  }

  async function saveEdit(id) {
    const updated = await api.updateEducation(id, { ...form, start_date: form.start_date || null, end_date: form.end_date || null });
    setEducation(e => e.map(x => x.id === id ? updated : x));
    setEditingId(null);
  }

  async function deleteEdu(id) {
    await api.deleteEducation(id);
    setEducation(e => e.filter(x => x.id !== id));
  }

  async function toggleVisibility(id) {
    const updated = await api.toggleEducationVisibility(id);
    setEducation(e => e.map(x => x.id === id ? updated : x));
  }

  function startEdit(edu) {
    setForm({ institution: edu.institution, degree: edu.degree || '', field_of_study: edu.field_of_study || '', start_date: toInputDate(edu.start_date), end_date: toInputDate(edu.end_date) });
    setEditingId(edu.id);
  }

  const EduForm = ({ onSave, onCancel }) => (
    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-xs text-gray-500 mb-1 block">Institution *</label>
          <input autoFocus className="input" value={form.institution} onChange={e => setForm(f => ({ ...f, institution: e.target.value }))} placeholder="University of Example" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Degree</label>
          <input className="input" value={form.degree} onChange={e => setForm(f => ({ ...f, degree: e.target.value }))} placeholder="Bachelor of Science" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Field of Study</label>
          <input className="input" value={form.field_of_study} onChange={e => setForm(f => ({ ...f, field_of_study: e.target.value }))} placeholder="Computer Science" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Start Date</label>
          <input type="date" className="input" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">End Date</label>
          <input type="date" className="input" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={onSave} className="btn-primary flex items-center gap-1"><Check size={14} />Save</button>
        <button onClick={onCancel} className="btn-ghost px-3 py-1.5 text-sm">Cancel</button>
      </div>
    </div>
  );

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title">Education</h2>
        <button onClick={() => setAdding(a => !a)} className="btn-secondary flex items-center gap-1">
          <Plus size={16} /> Add Education
        </button>
      </div>

      {adding && <div className="mb-4"><EduForm onSave={addEdu} onCancel={() => { setAdding(false); setForm(emptyForm); }} /></div>}

      {education.length === 0 && !adding && (
        <p className="text-sm text-gray-400 text-center py-6">No education added yet.</p>
      )}

      <div className="space-y-3">
        {education.map(edu => (
          <div key={edu.id} className={`flex items-start gap-3 p-4 rounded-xl border ${edu.is_public ? 'border-gray-100 bg-white' : 'border-dashed border-gray-200 bg-gray-50'}`}>
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 text-xs font-bold shrink-0">
              {edu.institution.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              {editingId === edu.id ? (
                <EduForm
                  onSave={() => saveEdit(edu.id)}
                  onCancel={() => { setEditingId(null); setForm(emptyForm); }}
                />
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{edu.institution}</p>
                      {(edu.degree || edu.field_of_study) && (
                        <p className="text-sm text-gray-600">
                          {[edu.degree, edu.field_of_study].filter(Boolean).join(', ')}
                        </p>
                      )}
                      {(edu.start_date || edu.end_date) && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {formatYear(edu.start_date)}{edu.start_date && edu.end_date ? ' – ' : ''}{formatYear(edu.end_date)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <VisibilityToggle isPublic={edu.is_public} onToggle={() => toggleVisibility(edu.id)} />
                      <button onClick={() => startEdit(edu)} className="btn-ghost"><Pencil size={15} /></button>
                      <button onClick={() => deleteEdu(edu.id)} className="btn-ghost text-red-400 hover:text-red-600"><Trash2 size={15} /></button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
