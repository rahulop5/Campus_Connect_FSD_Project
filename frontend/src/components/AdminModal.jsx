import { createPortal } from 'react-dom';
import '../styles/Admindashboard.css';

const AdminModal = ({ isOpen, onClose, title, children, actions, className = '' }) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className={`admin-modal ${className}`} onClick={(e) => e.stopPropagation()}>
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
    </div>,
    document.body
  );
};

export default AdminModal;
