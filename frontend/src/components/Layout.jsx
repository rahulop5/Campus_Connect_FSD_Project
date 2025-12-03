import Header from './Header';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
  const { user } = useAuth();

  return (
    <div>
      <Header />
      <div style={{ display: 'flex', overflowX: 'hidden', marginTop: '75px' }}>
        {user && user.role === 'Student' && <Sidebar />}
        <main style={{ flex: 1, marginLeft: user && user.role === 'Student' ? '0px' : '0' }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
