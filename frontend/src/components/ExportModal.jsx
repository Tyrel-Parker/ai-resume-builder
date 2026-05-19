import { useEffect, useState } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { api } from '../api';

export default function ExportModal({ platform, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fn = platform === 'linkedin' ? api.exportLinkedIn : api.exportIndeed;
    fn().then(setData).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [platform]);

  async function copy() {
    if (!data) return;
    await navigator.clipboard.writeText(data.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const title = platform === 'linkedin' ? 'Export for LinkedIn' : 'Export for Indeed';
  const instructions = platform === 'linkedin'
    ? 'Copy the text below and paste each section into your LinkedIn profile manually. LinkedIn\'s API does not permit direct profile updates from third-party apps.'
    : 'Copy the text below and paste it into your Indeed resume editor. You can paste the entire block or section by section.';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-lg">{title}</h2>
          <button onClick={onClose} className="btn-ghost"><X size={20} /></button>
        </div>

        <div className="p-5 flex-1 overflow-auto">
          {loading && <div className="animate-pulse bg-gray-100 rounded-lg h-64" />}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {data && (
            <>
              <p className="text-sm text-gray-500 mb-4">{instructions}</p>
              <pre className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-700 whitespace-pre-wrap leading-relaxed font-mono overflow-auto max-h-96">
                {data.text}
              </pre>
            </>
          )}
        </div>

        <div className="flex justify-end gap-3 p-5 border-t border-gray-100">
          <button onClick={onClose} className="btn-ghost px-4 py-2 text-sm">Close</button>
          {data && (
            <button onClick={copy} className="btn-primary flex items-center gap-2">
              {copied ? <><Check size={15} />Copied!</> : <><Copy size={15} />Copy All</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
