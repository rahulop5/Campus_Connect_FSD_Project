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

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useSelector((state) => state.auth);
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

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
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute>
                <ProfileWrapper />
            </ProtectedRoute>
          } />

          <Route path="/change-password" element={
            <ProtectedRoute>
              <ChangePassword />
            </ProtectedRoute>
          } />

          <Route path="/pricing" element={<Pricing />} />

          {/* Student Routes */}
          <Route path="/attendance" element={
            <RoleRoute role="Student">
              <Attendance />
            </RoleRoute>
          } />
          <Route path="/bellgraph" element={
            <RoleRoute role="Student">
              <Bellgraph />
            </RoleRoute>
          } />
          <Route path="/elections" element={
            <ProtectedRoute>
              <Elections />
            </ProtectedRoute>
          } />

          {/* Professor Routes */}
          <Route path="/academics" element={
            <RoleRoute role="Professor">
              <Academics />
            </RoleRoute>
          } />

          {/* Forum Routes */}
          <Route path="/forum/questions" element={
            <ProtectedRoute>
              <ForumList />
            </ProtectedRoute>
          } />
          <Route path="/forum/question/:id" element={
            <ProtectedRoute>
              <ForumDetail />
            </ProtectedRoute>
          } />
          <Route path="/forum/ask" element={
            <ProtectedRoute>
              <AskQuestion />
            </ProtectedRoute>
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
