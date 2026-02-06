import Header from './Header';
import Sidebar from './Sidebar';
import { useSelector } from 'react-redux';

const Layout = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  const showSidebar = user && (user.role === 'Student' || user.role === 'Professor');

  return (
    <div>
      <Header />
      <div style={{ display: 'flex', overflowX: 'hidden', marginTop: '75px' }}>
        {showSidebar && <Sidebar />}
        <main style={{ flex: 1, marginLeft: showSidebar ? '0px' : '0' }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
