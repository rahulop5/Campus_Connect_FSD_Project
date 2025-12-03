import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Pricing from './pages/Pricing';
import Profile from './pages/Profile';
import ProfessorProfile from './pages/ProfessorProfile';
import Attendance from './pages/Attendance';
import Bellgraph from './pages/Bellgraph';
import ForumList from './pages/ForumList';
import ForumDetail from './pages/ForumDetail';
import AskQuestion from './pages/AskQuestion';
import OAuthCallback from './pages/OAuthCallback';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

const RoleRoute = ({ children, role }) => {
    const { user, loading } = useAuth();
    if (loading) return <div>Loading...</div>;
    if (!user || user.role !== role) return <Navigate to="/dashboard" />;
    return children;
}

function App() {
  return (
    <AuthProvider>
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
    </AuthProvider>
  );
}

const ProfileWrapper = () => {
    const { user } = useAuth();
    if (user.role === 'Student') return <Profile />;
    if (user.role === 'Professor') return <ProfessorProfile />;
    return <div>Profile not available for this role</div>;
}

export default App;
