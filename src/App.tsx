import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardPage from './pages/DashboardPage';
import CharacterExplorer from './pages/CharacterExplorer';
import LaunchList from './features/launches/LaunchList';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-slate-50">
        <ErrorBoundary fallbackTitle="Navigation Fault">
          <Sidebar />
        </ErrorBoundary>
        <div className="flex-1 md:ml-64 flex flex-col">
          <Header />
          <main className="flex-1 p-8">
            <ErrorBoundary fallbackTitle="Runtime Feature Exception">
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/explorer" element={<CharacterExplorer />} />
                <Route path="/launches" element={<LaunchList />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
