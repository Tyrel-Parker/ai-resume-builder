import { useState } from 'react';
import Header from './components/Header';
import ProfileTab from './components/ProfileTab';
import ResumeBuilderTab from './components/ResumeBuilderTab';

export default function App() {
  const [tab, setTab] = useState('profile');

  return (
    <div className="min-h-screen bg-gray-100">
      <Header tab={tab} onTabChange={setTab} />
      <main className="max-w-4xl mx-auto px-4 py-6">
        {tab === 'profile' && <ProfileTab />}
        {tab === 'builder' && <ResumeBuilderTab />}
      </main>
    </div>
  );
}
