import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import RestaurantDashboard from './pages/RestaurantDashboard';
import NGODashboard from './pages/NGODashboard';
import Login from './pages/Login';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        
        {/* Protected Supplier Routes */}
        <Route 
          path="/restaurant" 
          element={
            <ProtectedRoute requiredRole="supplier">
              <RestaurantDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Protected NGO Routes */}
        <Route 
          path="/ngo" 
          element={
            <ProtectedRoute requiredRole="ngo">
              <NGODashboard />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </>
  );
}

export default App;
