import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function RedirectHandler() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const path = queryParams.get('path');
    if (path) {
      navigate('/' + path, { replace: true });
    }
  }, [location, navigate]);

  return null;
}

export default RedirectHandler;
