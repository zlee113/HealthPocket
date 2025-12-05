/*
App.js    Ishani Kohli    Virginia Tech   Sprint 2
switches between /login and /dashboard pages using hashchange
*/
import { useEffect, useState } from 'react';
import Login from './Login';
import Dashboard from './Dashboard';

function App() {
  const [route, setRoute] = useState('/login');

  useEffect(() => {
    const handleHashChange = () => {
      const next = window.location.hash.replace('#', '') || '/login';
      setRoute(next);
    };

    // Handle the current URL on load
    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (route.startsWith('/dashboard')) return <Dashboard />;
  return <Login />;
}

export default App;
