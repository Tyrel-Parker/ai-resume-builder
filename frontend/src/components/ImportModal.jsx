import { useState, useRef } from 'react';
import { X, Upload, FileText, Check, ChevronDown, ChevronRight, Loader } from 'lucide-react';
import { api } from '../api';

function PreviewSection({ title, count, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden mb-3">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 text-sm font-medium text-gray-700 hover:bg-gray-100">
        <span>{title} <span className="text-gray-400 font-normal">({count})</span></span>
        {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
      </button>
      {open && <div className="p-4 space-y-2 text-sm">{children}</div>}
    </div>
  );
}

export default function ImportModal({ onClose, onDone }) {
  const [tab, setTab] = useState('linkedin');
  const [step, setStep] = useState('input'); // input | preview | done
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef();

  async function handleFile(file) {
    if (!file) return;
    if (!file.name.endsWith('.zip')) { setError('Please select a .zip file (the LinkedIn data export archive).'); return; }
    setLoading(true); setError('');
    try {
      const data = await api.importLinkedIn(file);
      setPreview(data);
      setStep('preview');
    } catch (err) {
      console.error('[import] upload error:', err);
      setError(err.message.includes('fetch')
        ? `Network error — could not reach ${import.meta.env.VITE_API_URL ?? '(VITE_API_URL not set)'}. Check browser console for details.`
        : err.message);
    } finally { setLoading(false); }
  }

  function parseLinkedIn(e) { handleFile(e.target.files[0]); }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }

  async function parseText() {
    if (!resumeText.trim()) { setError('Please paste your resume text.'); return; }
    setLoading(true); setError('');
    try {
      const data = await api.parseResumeText(resumeText);
      setPreview(data);
      setStep('preview');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function saveImport() {
    setLoading(true); setError('');
    try {
      const res = await api.saveImport(preview);
      setResult(res);
      setStep('done');
      onDone?.();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  function reset() { setStep('input'); setPreview(null); setResult(null); setError(''); setResumeText(''); }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-lg">Import Profile</h2>
          <button onClick={onClose} className="btn-ghost"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-auto p-5">

          {/* ── Step: input ── */}
          {step === 'input' && (
            <div>
              <div className="flex gap-2 mb-5">
                {['linkedin', 'text'].map(t => (
                  <button key={t} onClick={() => { setTab(t); setError(''); }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${tab === t ? 'bg-brand text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {t === 'linkedin' ? 'LinkedIn Data Export' : 'Paste Resume Text'}
                  </button>
                ))}
              </div>

              {tab === 'linkedin' && (
                <div>
                  <p className="text-sm text-gray-600 mb-4">
                    Download your LinkedIn data archive: <strong>Settings → Data Privacy → Get a copy of your data</strong> → select <em>Profile data only</em> → request. Upload the zip file here.
                  </p>
                  <div
                    onClick={() => !loading && fileRef.current.click()}
                    onDragOver={e => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={onDrop}
                    className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                      dragging ? 'border-brand bg-brand-light/50' : 'border-gray-300 hover:border-brand hover:bg-brand-light/30'
                    }`}
                  >
                    {loading ? <Loader size={32} className="mx-auto animate-spin text-brand mb-2" /> : <Upload size={32} className="mx-auto text-gray-400 mb-2" />}
                    <p className="text-sm text-gray-600">{loading ? 'Parsing your LinkedIn data…' : dragging ? 'Drop it!' : 'Click or drag & drop your LinkedIn zip file'}</p>
                  </div>
                  <input ref={fileRef} type="file" accept=".zip" className="hidden" onChange={parseLinkedIn} />
                </div>
              )}

              {tab === 'text' && (
                <div>
                  <p className="text-sm text-gray-600 mb-3">
                    Paste your Indeed resume, any plain-text resume, or a copy-pasted LinkedIn profile. The AI will extract jobs, skills, and education from it.
                  </p>
                  <textarea
                    className="textarea"
                    rows={12}
                    value={resumeText}
                    onChange={e => setResumeText(e.target.value)}
                    placeholder="John Smith&#10;New York, NY | john@example.com&#10;&#10;WORK EXPERIENCE&#10;Software Engineer — Acme Corp (2020–Present)&#10;• Built distributed systems...&#10;&#10;SKILLS&#10;Python, JavaScript, AWS..."
                  />
                  <button onClick={parseText} disabled={loading} className="btn-primary mt-3 flex items-center gap-2">
                    {loading ? <><Loader size={15} className="animate-spin" />Parsing with AI…</> : <><FileText size={15} />Parse Resume</>}
                  </button>
                  {loading && <p className="text-xs text-gray-400 mt-2">This may take 30–60 seconds.</p>}
                </div>
              )}

              {error && <p className="mt-4 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            </div>
          )}

          {/* ── Step: preview ── */}
          {step === 'preview' && preview && (
            <div>
              <p className="text-sm text-gray-500 mb-4">
                Review the data below before importing. Existing jobs, skills, and education with matching names will be skipped. New items are marked public by default.
              </p>

              {preview.profile && Object.values(preview.profile).some(Boolean) && (
                <PreviewSection title="Profile" count={Object.values(preview.profile).filter(Boolean).length + ' fields'}>
                  {Object.entries(preview.profile).filter(([, v]) => v).map(([k, v]) => (
                    <div key={k} className="flex gap-2">
                      <span className="text-gray-400 w-20 shrink-0 capitalize">{k.replace('_', ' ')}</span>
                      <span className="text-gray-800">{v}</span>
                    </div>
                  ))}
                </PreviewSection>
              )}

              {preview.jobs?.length > 0 && (
                <PreviewSection title="Jobs" count={preview.jobs.length}>
                  {preview.jobs.map((j, i) => (
                    <div key={i} className="pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                      <p className="font-medium text-gray-900">{j.title} <span className="font-normal text-gray-500">at {j.company}</span></p>
                      {j.location && <p className="text-xs text-gray-400">{j.location}</p>}
                      {j.bullets?.length > 0 && (
                        <ul className="mt-1 space-y-0.5">
                          {j.bullets.map((b, bi) => <li key={bi} className="text-gray-600 text-xs">• {b}</li>)}
                        </ul>
                      )}
                    </div>
                  ))}
                </PreviewSection>
              )}

              {preview.skills?.length > 0 && (
                <PreviewSection title="Skills" count={preview.skills.length}>
                  <div className="flex flex-wrap gap-1.5">
                    {preview.skills.map((s, i) => (
                      <span key={i} className="px-2.5 py-1 bg-brand-light text-brand text-xs rounded-full">{s}</span>
                    ))}
                  </div>
                </PreviewSection>
              )}

              {preview.education?.length > 0 && (
                <PreviewSection title="Education" count={preview.education.length}>
                  {preview.education.map((e, i) => (
                    <div key={i}>
                      <p className="font-medium text-gray-900">{e.institution}</p>
                      {(e.degree || e.field_of_study) && <p className="text-xs text-gray-500">{[e.degree, e.field_of_study].filter(Boolean).join(', ')}</p>}
                    </div>
                  ))}
                </PreviewSection>
              )}

              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            </div>
          )}

          {/* ── Step: done ── */}
          {step === 'done' && result && (
            <div className="text-center py-6">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check size={28} className="text-green-600" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">Import Complete</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>{result.created.jobs} jobs added, {result.skipped.jobs} already existed</p>
                <p>{result.created.bullets} bullets added</p>
                <p>{result.created.skills} skills added, {result.skipped.skills} already existed</p>
                <p>{result.created.education} education entries added</p>
              </div>
              <p className="mt-4 text-xs text-gray-400">All imported items are marked public. Toggle visibility on any item in your profile.</p>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center p-5 border-t border-gray-100">
          <div>
            {step === 'preview' && (
              <button onClick={reset} className="btn-ghost px-3 py-1.5 text-sm">← Back</button>
            )}
          </div>
          <div className="flex gap-2">
            {step === 'done'
              ? <button onClick={onClose} className="btn-primary">Done</button>
              : <>
                  <button onClick={onClose} className="btn-ghost px-4 py-2 text-sm">Cancel</button>
                  {step === 'preview' && (
                    <button onClick={saveImport} disabled={loading} className="btn-primary flex items-center gap-2">
                      {loading ? <><Loader size={15} className="animate-spin" />Saving…</> : <><Check size={15} />Import All</>}
                    </button>
                  )}
                </>
            }
          </div>
        </div>
      </div>
    </div>
  );
}
