import { Outlet, NavLink, useParams, useNavigate } from 'react-router-dom';

export default function PanelLayout() {
  const { role } = useParams();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  // Capitalize first letter for display
  const displayRole = role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Panel';

  return (
    <div className="panel-container">
      {/* Navy blue navbar on the left side */}
      <nav className="left-navbar">
        <h2>{displayRole} Menu</h2>
        <ul>
          <li>
            <NavLink to={`/panel/${role}/dashboard`} className={({isActive}) => isActive ? 'active' : ''}>
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink to={`/panel/${role}/history`} className={({isActive}) => isActive ? 'active' : ''}>
              History
            </NavLink>
          </li>
          {/* You can add role-specific links here by checking the 'role' variable */}
        </ul>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </nav>

      <main className="panel-content">
        <header className="panel-header">
          <h1>{displayRole} Portal</h1>
        </header>
        <div className="page-content">
          <Outlet /> {/* This renders Dashboard, History, etc. */}
        </div>
      </main>
    </div>
  );
}
