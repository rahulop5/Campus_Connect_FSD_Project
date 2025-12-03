import { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const res = await api.get('/auth/student/me');
        // Backend returns { role: "Student", user: {...} }
        // We need to combine them into one user object
        setUser({ ...res.data.user, role: res.data.role });
      } catch (error) {
        console.error("Auth check failed", error);
        localStorage.removeItem('token');
        setUser(null);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const login = async (email, password, role) => {
    let url = '';
    if (role === 'Student') url = '/auth/student/login';
    else if (role === 'Professor') url = '/auth/professor/login';
    else if (role === 'Admin') url = '/auth/admin/login';

    const res = await api.post(url, { email, pass: password });
    localStorage.setItem('token', res.data.token);
    
    // Fetch full user data after login
    await fetchUserData();
    
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  // Function to manually refresh user data (useful after OAuth)
  const refreshUser = async () => {
    await fetchUserData();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, refreshUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
