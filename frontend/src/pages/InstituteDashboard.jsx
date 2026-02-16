import { useState, useEffect } from 'react';
import api from '../api/axios';
import Layout from '../components/Layout';

const InstituteDashboard = () => {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/institutes/pending');
      setRequests(res.data);
    } catch (error) {
      console.error("Error fetching requests:", error);
    }
  };

  const handleAction = async (userId, action) => {
    try {
        await api.post('/institutes/verify', { userId, action });
        fetchRequests(); // Refresh list
    } catch (error) {
        alert(error.response?.data?.message || "Error processing request");
    }
  }

  return (
    <Layout>
      <div className="admin-dashboard" style={{ padding: '40px', color: 'white' }}>
        <h1 className="outfit">Institute Administration</h1>
        
        <div className="requests-section" style={{ marginTop: '30px' }}>
            <h2>Pending Join Requests</h2>
            {requests.length === 0 ? (
                <p>No pending requests.</p>
            ) : (
                <table style={{ width: '100%', marginTop: '20px', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #555' }}>
                            <th style={{ textAlign: 'left', padding: '10px' }}>Name</th>
                            <th style={{ textAlign: 'left', padding: '10px' }}>Email</th>
                            <th style={{ textAlign: 'left', padding: '10px' }}>Requested Role</th>
                            <th style={{ textAlign: 'left', padding: '10px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.map(req => (
                            <tr key={req._id} style={{ borderBottom: '1px solid #333' }}>
                                <td style={{ padding: '10px' }}>{req.name}</td>
                                <td style={{ padding: '10px' }}>{req.email}</td>
                                <td style={{ padding: '10px' }}>{req.role}</td>
                                <td style={{ padding: '10px' }}>
                                    <button 
                                        onClick={() => handleAction(req._id, 'approve')}
                                        style={{ marginRight: '10px', backgroundColor: 'green', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer' }}
                                    >
                                        Approve
                                    </button>
                                    <button 
                                        onClick={() => handleAction(req._id, 'reject')}
                                        style={{ backgroundColor: 'red', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer' }}
                                    >
                                        Reject
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
      </div>
    </Layout>
  );
};

export default InstituteDashboard;
