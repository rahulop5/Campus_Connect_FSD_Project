import React from 'react';

const ProfilePicture = ({ profilePic, noImage, onFileSelect, onChangeClick, onDeleteClick, onAddClick }) => {
  return (
    <div className={`pfpContainer ${noImage ? 'noImage' : ''}`}>
      <input
        type="file"
        id="pfpFileInput"
        accept="image/*"
        onChange={onFileSelect}
        hidden
      />
      {!noImage && (
        <img id="profilePic" src={profilePic} alt="Profile Picture" />
      )}
      <div className="pfpOverlay">
        <div className="pfpBtn" id="changeBtn" onClick={onChangeClick} />
        <div className="pfpBtn" id="deleteBtn" onClick={onDeleteClick} />
        <div className="pfpBtn" id="addBtn" onClick={onAddClick} />
      </div>
    </div>
  );
};

export default ProfilePicture;
