import React from 'react';

const ProfileField = ({ label, value, isEditing, isPassword, onEdit, onSave, onChange }) => {
  return (
    <div className="auth_qa">
      <div className="auth_q">{label}</div>
      <div className="auth_a">
        <div>
          <input
            type={isPassword ? 'text' : 'text'}
            value={value}
            readOnly={!isEditing || isPassword}
            onChange={(e) => onChange(e.target.value)}
            className={`editable-input ${isEditing ? 'editing' : ''}`}
          />
        </div>
        {!isPassword && (
          <div className="image_div">
            <img
              className="edit_mark"
              src={isEditing ? './assets/check.png' : './assets/edit-text 2.png'}
              alt={`edit ${label.toLowerCase()}`}
              onClick={() => (isEditing ? onSave() : onEdit())}
            />
          </div>
        )}
        {isPassword && (
          <div className="image_div">
            <img
              className="edit_mark"
              src="./assets/edit-text 2.png"
              alt="edit password"
              onClick={onEdit}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileField;
