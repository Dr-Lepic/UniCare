import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import PanelLayout from './pages/PanelLayout';
import Dashboard from './pages/Dashboard';
import History from './pages/History';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      
      <Route path="/panel/:role" element={<PanelLayout />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="history" element={<History />} />
        {/* Add more nested routes here as needed */}
      </Route>
      
      <Route path="*" element={<div>Page Not Found</div>} />
    </Routes>
  );
}

export default App;
