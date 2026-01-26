import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { Tours } from './pages/Tours';
import { TourDetail } from './pages/TourDetail';
import { Collections } from './pages/Collections';
import { CollectionDetail } from './pages/CollectionDetail';
import { Settings } from './pages/Settings';
import { Audio } from './pages/Audio';
import { ApiFeeds } from './pages/ApiFeeds';
import { AIAssistance } from './pages/AIAssistance';
import { VisitorStop } from './pages/VisitorStop';
import { Docs } from './pages/Docs';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Visitor Routes - NO admin layout */}
        <Route path="/visitor/tour/:tourId/stop/:stopId" element={<VisitorStop />} />

        {/* Documentation - Full-screen, no admin layout */}
        <Route path="/docs" element={<Docs />} />
        <Route path="/docs/:section" element={<Docs />} />
        <Route path="/docs/:section/:page" element={<Docs />} />

        {/* Admin Routes - WITH MainLayout */}
        <Route path="/*" element={
          <MainLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/tours" element={<Tours />} />
              <Route path="/tours/:id" element={<TourDetail />} />
              <Route path="/collections" element={<Collections />} />
              <Route path="/collections/:id" element={<CollectionDetail />} />
              <Route path="/templates" element={<ComingSoon title="Templates" />} />
              <Route path="/media" element={<ComingSoon title="Media Library" />} />
              <Route path="/languages" element={<ComingSoon title="Languages" />} />
              <Route path="/audio" element={<Audio />} />
              <Route path="/analytics" element={<ComingSoon title="Analytics" />} />
              <Route path="/api" element={<ApiFeeds />} />
              <Route path="/tools" element={<ComingSoon title="Tools" />} />
              <Route path="/ai-assistance" element={<AIAssistance />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/help" element={<ComingSoon title="Help" />} />
            </Routes>
          </MainLayout>
        } />
      </Routes>
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
