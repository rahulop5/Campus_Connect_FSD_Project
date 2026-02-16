import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserData } from './store/slices/authSlice';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Pricing from './pages/Pricing';
import Profile from './pages/Profile';
import ProfessorProfile from './pages/ProfessorProfile';
import ChangePassword from './pages/ChangePassword';
import Attendance from './pages/Attendance';
import Bellgraph from './pages/Bellgraph';
import Elections from './pages/Elections';
import ForumList from './pages/ForumList';
import ForumDetail from './pages/ForumDetail';
import AskQuestion from './pages/AskQuestion';
import Academics from './pages/Academics';
import OAuthCallback from './pages/OAuthCallback';
import LandingPage from './pages/LandingPage';
import InstituteDashboard from './pages/InstituteDashboard';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useSelector((state) => state.auth);
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

const InstituteRoute = ({ children }) => {
    const { user, loading } = useSelector((state) => state.auth);
    if (loading) return <div>Loading...</div>;
    if (!user) return <Navigate to="/login" />;
    
    // If no institute or pending, go to landing
    if (!user.instituteId || user.verificationStatus === 'pending') {
        return <Navigate to="/landing" />;
    }
    return children;
}

const RoleRoute = ({ children, role }) => {
    const { user, loading } = useSelector((state) => state.auth);
    if (loading) return <div>Loading...</div>;
    if (!user || user.role !== role) return <Navigate to="/dashboard" />;
    return children;
}

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchUserData());
  }, [dispatch]);

  return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/oauth-callback" element={<OAuthCallback />} />
          
          {/* Landing Page for Institute Selection */}
          <Route path="/landing" element={
              <ProtectedRoute>
                  <LandingPage />
              </ProtectedRoute>
          } />

          {/* Institute Admin Dashboard */}
           <Route path="/institute/dashboard" element={
              <RoleRoute role="Admin">
                  <InstituteDashboard />
              </RoleRoute>
          } />

          <Route path="/dashboard" element={
            <InstituteRoute>
              <Dashboard />
            </InstituteRoute>
          } />

          <Route path="/profile" element={
            <InstituteRoute>
                <ProfileWrapper />
            </InstituteRoute>
          } />

          <Route path="/change-password" element={
            <InstituteRoute>
              <ChangePassword />
            </InstituteRoute>
          } />

          <Route path="/pricing" element={<Pricing />} />

          {/* Student Routes */}
          <Route path="/attendance" element={
            <InstituteRoute>
                <RoleRoute role="Student">
                <Attendance />
                </RoleRoute>
            </InstituteRoute>
          } />
          <Route path="/bellgraph" element={
            <InstituteRoute>
                <RoleRoute role="Student">
                <Bellgraph />
                </RoleRoute>
            </InstituteRoute>
          } />
          <Route path="/elections" element={
            <InstituteRoute>
              <Elections />
            </InstituteRoute>
          } />

          {/* Professor Routes */}
          <Route path="/academics" element={
            <InstituteRoute>
                <RoleRoute role="Professor">
                <Academics />
                </RoleRoute>
            </InstituteRoute>
          } />

          {/* Forum Routes */}
          <Route path="/forum/questions" element={
            <InstituteRoute>
              <ForumList />
            </InstituteRoute>
          } />
          <Route path="/forum/question/:id" element={
            <InstituteRoute>
              <ForumDetail />
            </InstituteRoute>
          } />
          <Route path="/forum/ask" element={
            <InstituteRoute>
              <AskQuestion />
            </InstituteRoute>
          } />

        </Routes>
      </BrowserRouter>
  );
}

const ProfileWrapper = () => {
    const { user } = useSelector((state) => state.auth);
    if (user.role === 'Student') return <Profile />;
    if (user.role === 'Professor') return <ProfessorProfile />;
    return <div>Profile not available for this role</div>;
}

export default App;
