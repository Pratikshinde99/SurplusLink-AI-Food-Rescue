import { Navigate, useLocation } from 'react-router-dom';
import { api } from '../lib/api';

const ProtectedRoute = ({ children, requiredRole }) => {
  const token = api.getAuthToken();
  const user = api.getUserData();
  const location = useLocation();

  if (!token) {
    // Redirect to login but save the current location they were trying to go to
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    // Redirect to their own dashboard if they have the wrong role
    const target = user.role === 'supplier' ? '/restaurant' : '/ngo';
    return <Navigate to={target} replace />;
  }

  return children;
};

export default ProtectedRoute;
