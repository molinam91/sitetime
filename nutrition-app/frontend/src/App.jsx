import { Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Profile from './pages/Profile.jsx';
import Foods from './pages/Foods.jsx';
import Favorites from './pages/Favorites.jsx';
import Progress from './pages/Progress.jsx';

export default function App() {
  return (
    <div className="app">
      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/perfil" element={<Profile />} />
          <Route path="/alimentos" element={<Foods />} />
          <Route path="/favoritos" element={<Favorites />} />
          <Route path="/progreso" element={<Progress />} />
        </Routes>
      </main>
      <NavBar />
    </div>
  );
}
