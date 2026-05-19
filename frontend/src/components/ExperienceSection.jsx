import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import JobCard from './JobCard';
import { api } from '../api';

const emptyJob = { company: '', title: '', location: '', start_date: '', end_date: '', is_current: false };

export default function ExperienceSection() {
  const [jobs, setJobs] = useState([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(emptyJob);
  const [error, setError] = useState('');

  useEffect(() => { api.getJobs().then(setJobs); }, []);

  async function addJob() {
    if (!form.company.trim() || !form.title.trim()) { setError('Company and title are required.'); return; }
    const job = await api.createJob({ ...form, start_date: form.start_date || null, end_date: form.is_current ? null : form.end_date || null });
    setJobs(j => [job, ...j]);
    setAdding(false);
    setForm(emptyJob);
    setError('');
  }

  async function updateJob(id, data) {
    const updated = await api.updateJob(id, data);
    setJobs(j => j.map(x => x.id === id ? { ...x, ...updated } : x));
  }

  async function deleteJob(id) {
    if (!confirm('Delete this job and all its bullets?')) return;
    await api.deleteJob(id);
    setJobs(j => j.filter(x => x.id !== id));
  }

  async function toggleJobVisibility(id) {
    const updated = await api.toggleJobVisibility(id);
    setJobs(j => j.map(x => x.id === id ? { ...x, is_public: updated.is_public } : x));
  }

  async function addBullet(jobId, content) {
    const bullet = await api.createBullet(jobId, { content });
    setJobs(j => j.map(x => x.id === jobId ? { ...x, bullets: [...(x.bullets || []), bullet] } : x));
  }

  async function updateBullet(jobId, bulletId, content) {
    const updated = await api.updateBullet(jobId, bulletId, { content });
    setJobs(j => j.map(x => x.id === jobId
      ? { ...x, bullets: x.bullets.map(b => b.id === bulletId ? updated : b) }
      : x
    ));
  }

  async function deleteBullet(jobId, bulletId) {
    await api.deleteBullet(jobId, bulletId);
    setJobs(j => j.map(x => x.id === jobId
      ? { ...x, bullets: x.bullets.filter(b => b.id !== bulletId) }
      : x
    ));
  }

  async function toggleBulletVisibility(jobId, bulletId) {
    const updated = await api.toggleBulletVisibility(jobId, bulletId);
    setJobs(j => j.map(x => x.id === jobId
      ? { ...x, bullets: x.bullets.map(b => b.id === bulletId ? updated : b) }
      : x
    ));
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title">Experience</h2>
        <button onClick={() => setAdding(a => !a)} className="btn-secondary flex items-center gap-1">
          <Plus size={16} /> Add Job
        </button>
      </div>

      {adding && (
        <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Job Title *</label>
              <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Software Engineer" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Company *</label>
              <input className="input" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} placeholder="Acme Corp" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Location</label>
              <input className="input" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="City, State" />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm pb-2">
                <input type="checkbox" checked={form.is_current} onChange={e => setForm(f => ({ ...f, is_current: e.target.checked }))} />
                Current position
              </label>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Start Date</label>
              <input type="date" className="input" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">End Date</label>
              <input type="date" className="input" value={form.end_date} disabled={form.is_current} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
            </div>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-2">
            <button onClick={addJob} className="btn-primary">Add Job</button>
            <button onClick={() => { setAdding(false); setForm(emptyJob); setError(''); }} className="btn-ghost px-3 py-1.5 text-sm">Cancel</button>
          </div>
        </div>
      )}

      {jobs.length === 0 && !adding && (
        <p className="text-sm text-gray-400 text-center py-8">No experience added yet. Click "Add Job" to get started.</p>
      )}

      <div className="space-y-3">
        {jobs.map(job => (
          <JobCard
            key={job.id}
            job={job}
            onUpdate={updateJob}
            onDelete={deleteJob}
            onToggleVisibility={toggleJobVisibility}
            onAddBullet={addBullet}
            onUpdateBullet={updateBullet}
            onDeleteBullet={deleteBullet}
            onToggleBulletVisibility={toggleBulletVisibility}
          />
        ))}
      </div>
    </div>
  );
}
