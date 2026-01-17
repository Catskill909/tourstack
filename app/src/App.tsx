import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { Tours } from './pages/Tours';
import { Settings } from './pages/Settings';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tours" element={<Tours />} />
          <Route path="/templates" element={<ComingSoon title="Templates" />} />
          <Route path="/media" element={<ComingSoon title="Media Library" />} />
          <Route path="/languages" element={<ComingSoon title="Languages" />} />
          <Route path="/analytics" element={<ComingSoon title="Analytics" />} />
          <Route path="/tools" element={<ComingSoon title="Tools" />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/help" element={<ComingSoon title="Help" />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}

// Placeholder for routes we haven't built yet
function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2">{title}</h1>
        <p className="text-[var(--color-text-muted)]">This section is coming soon</p>
      </div>
    </div>
  );
}

export default App;
