import { useState, useEffect } from 'react';
import { Sparkles, Clock, ChevronRight } from 'lucide-react';
import GeneratedDocuments from './GeneratedDocuments';
import { api } from '../api';

export default function ResumeBuilderTab() {
  const [jobDescription, setJobDescription] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => { api.getHistory().then(setHistory).catch(() => {}); }, []);

  async function generate() {
    if (!jobDescription.trim()) { setError('Please paste a job description.'); return; }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await api.generate({ jobDescription, companyName, jobTitle });
      setResult({ ...res, companyName });
      setHistory(h => [{ id: res.id, company_name: companyName, job_title: jobTitle, created_at: new Date().toISOString() }, ...h]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadHistory(id) {
    const doc = await api.getGenerated(id);
    setResult({ resume: doc.resume_content, coverLetter: doc.cover_letter_content, studyGuide: doc.study_guide_content, companyName: doc.company_name });
    setJobDescription(doc.job_description);
    setCompanyName(doc.company_name || '');
    setJobTitle(doc.job_title || '');
    setHistoryOpen(false);
  }

  return (
    <div className="space-y-4">
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Generate Documents</h2>
          {history.length > 0 && (
            <button onClick={() => setHistoryOpen(h => !h)} className="btn-ghost flex items-center gap-1 text-sm px-3 py-1.5">
              <Clock size={15} /> History ({history.length})
            </button>
          )}
        </div>

        {historyOpen && (
          <div className="mb-4 border border-gray-200 rounded-xl overflow-hidden">
            {history.map(h => (
              <button
                key={h.id}
                onClick={() => loadHistory(h.id)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-0 text-left"
              >
                <span>
                  <span className="font-medium">{h.company_name || 'Unknown Company'}</span>
                  {h.job_title && <span className="text-gray-500"> — {h.job_title}</span>}
                </span>
                <span className="text-gray-400 text-xs flex items-center gap-1">
                  {new Date(h.created_at).toLocaleDateString()}
                  <ChevronRight size={14} />
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Company Name</label>
              <input className="input" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Acme Corp" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Job Title</label>
              <input className="input" value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="Senior Software Engineer" />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Job Description *</label>
            <textarea
              className="textarea"
              rows={10}
              value={jobDescription}
              onChange={e => setJobDescription(e.target.value)}
              placeholder="Paste the full job description here. The AI will analyze it and select your most relevant experience, then generate a tailored resume, cover letter, and interview prep guide."
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <button onClick={generate} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating… this may take 1–3 minutes
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Generate Resume, Cover Letter & Interview Prep
              </>
            )}
          </button>

          {loading && (
            <p className="text-xs text-center text-gray-400">
              The AI is selecting your most relevant experience and crafting your documents. Please wait.
            </p>
          )}
        </div>
      </div>

      {result && <GeneratedDocuments result={result} />}
    </div>
  );
}
