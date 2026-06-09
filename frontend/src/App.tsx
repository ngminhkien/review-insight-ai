import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { UploadPage } from './pages/UploadPage';
import { DashboardPage } from './pages/DashboardPage';
import { HistoryPage } from './pages/HistoryPage';
import { ProductComparisonPage } from './pages/ProductComparisonPage';
import { SingleAnalyzePage } from './pages/SingleAnalyzePage';

const App: React.FC = () => {
  return (
    <Router>
      <div className="flex min-h-screen bg-[#0b0f19] text-gray-200 antialiased overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
          <Routes>
            <Route path="/" element={<UploadPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/compare" element={<ProductComparisonPage />} />
            <Route path="/playground" element={<SingleAnalyzePage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
