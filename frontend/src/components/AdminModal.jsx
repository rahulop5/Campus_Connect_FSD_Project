import '../styles/Admindashboard.css';

const AdminModal = ({ isOpen, onClose, title, children, actions }) => {
  if (!isOpen) return null;

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <div className="admin-modal-body">
          {children}
        </div>
        {actions && (
          <div className="admin-modal-actions">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminModal;
