import { useNavigate } from 'react-router-dom';

export function useAuth() {
  const navigate = useNavigate();

  const logout = () => {
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('user');
    navigate('/login');
  };

  return { logout };
}
