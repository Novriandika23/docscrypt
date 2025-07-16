import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../services/api';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  
  if (!isAuthenticated()) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return children;
};

export default ProtectedRoute;
