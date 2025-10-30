/*
import { useEffect, useMemo, useState } from 'react';
import Login from './Login';
import Dashboard from './Dashboard';

function App() {
  const [route, setRoute] = useState(() => (window.location.hash.replace('#', '') || '/login'));

  useEffect(() => {
    function onHashChange() {
      const next = window.location.hash.replace('#', '') || '/login';
      setRoute(next);
    }
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const page = useMemo(() => {
    if (route.startsWith('/dashboard')) return <Dashboard />;
    return <Login />;
  }, [route]);

  return page;
}

export default App;
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
