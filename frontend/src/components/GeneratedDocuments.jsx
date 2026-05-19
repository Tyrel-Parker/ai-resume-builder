import { useState } from 'react';
import { Copy, Check, Download } from 'lucide-react';

const TABS = [
  { id: 'resume', label: 'Resume' },
  { id: 'coverLetter', label: 'Cover Letter' },
  { id: 'studyGuide', label: 'Interview Prep' },
];

export default function GeneratedDocuments({ result }) {
  const [activeTab, setActiveTab] = useState('resume');
  const [copied, setCopied] = useState(false);

  const content = {
    resume: result.resume,
    coverLetter: result.coverLetter,
    studyGuide: result.studyGuide,
  }[activeTab];

  async function copy() {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function download() {
    const labels = { resume: 'resume', coverLetter: 'cover-letter', studyGuide: 'interview-prep' };
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${labels[activeTab]}${result.companyName ? '-' + result.companyName.replace(/\s+/g, '-').toLowerCase() : ''}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-4 pb-0">
        <div className="flex gap-1">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
                activeTab === t.id
                  ? 'border-brand text-brand bg-brand-light/40'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 pb-2">
          <button onClick={copy} className="btn-ghost flex items-center gap-1 text-xs px-2.5 py-1.5">
            {copied ? <><Check size={13} />Copied</> : <><Copy size={13} />Copy</>}
          </button>
          <button onClick={download} className="btn-ghost flex items-center gap-1 text-xs px-2.5 py-1.5">
            <Download size={13} />Download
          </button>
        </div>
      </div>
      <div className="border-t border-gray-100 p-5">
        <pre className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed font-sans">{content}</pre>
      </div>
    </div>
  );
}
