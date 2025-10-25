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
