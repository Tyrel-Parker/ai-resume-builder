import { useState, useRef } from 'react';
import { Share2, Upload } from 'lucide-react';
import ProfileHeader from './ProfileHeader';
import ExperienceSection from './ExperienceSection';
import SkillsSection from './SkillsSection';
import EducationSection from './EducationSection';
import ExportModal from './ExportModal';
import ImportModal from './ImportModal';

export default function ProfileTab() {
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  function handleImportDone() {
    setRefreshKey(k => k + 1);
  }

  return (
    <div className="space-y-4">
      <ProfileHeader key={`profile-${refreshKey}`} />
      <ExperienceSection key={`exp-${refreshKey}`} />
      <SkillsSection key={`skills-${refreshKey}`} />
      <EducationSection key={`edu-${refreshKey}`} />
      <div className="flex justify-center gap-3 pt-2 pb-6 flex-wrap">
        <button onClick={() => setImportOpen(true)} className="btn-secondary flex items-center gap-2">
          <Upload size={15} /> Import from LinkedIn / Indeed
        </button>
        <button onClick={() => setExportOpen('linkedin')} className="btn-primary flex items-center gap-2">
          <Share2 size={15} /> Export for LinkedIn
        </button>
        <button onClick={() => setExportOpen('indeed')} className="btn-secondary flex items-center gap-2">
          <Share2 size={15} /> Export for Indeed
        </button>
      </div>
      {exportOpen && <ExportModal platform={exportOpen} onClose={() => setExportOpen(false)} />}
      {importOpen && <ImportModal onClose={() => setImportOpen(false)} onDone={handleImportDone} />}
    </div>
  );
}
