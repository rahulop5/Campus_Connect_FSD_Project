import { useState } from 'react';

export const useEditableField = (fieldName, initialValue) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const [originalValue, setOriginalValue] = useState(initialValue);

  const handleEditClick = () => {
    if (fieldName === 'password') {
      window.location.href = '/changepassword';
      return;
    }
    setIsEditing(true);
  };

  const handleCheckClick = async (onSave) => {
    if (fieldName === 'phone') {
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(value)) {
        alert('Please enter a valid 10-digit phone number.');
        return;
      }
    }

    if (onSave) {
      await onSave(fieldName, value);
    }

    setIsEditing(false);
    setOriginalValue(value);
  };

  const handleCancel = () => {
    setValue(originalValue);
    setIsEditing(false);
  };

  const handleChange = (newValue) => {
    setValue(newValue);
  };

  return {
    isEditing,
    value,
    handleEditClick,
    handleCheckClick,
    handleCancel,
    handleChange,
    setValue,
  };
};

export const useProfilePicture = (initialImagePath, onUpload = null) => {
  const [profilePic, setProfilePic] = useState(initialImagePath);
  const [noImage, setNoImage] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setUploadError('Please select a valid image file');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setUploadError('Image size must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Image = e.target.result;
        setProfilePic(base64Image);
        setNoImage(false);
        setUploadError(null);

        if (onUpload) {
          try {
            setUploading(true);
            await onUpload(file);
          } catch (error) {
            console.error('Upload error:', error);
            setUploadError(error.message || 'Failed to upload image');
          } finally {
            setUploading(false);
          }
        }
      };

      reader.onerror = () => {
        setUploadError('Failed to read file');
      };

      reader.readAsDataURL(file);
    }
  };

  const handleDeleteProfilePic = async () => {
    try {
      if (onUpload) {
        await fetch('/profile/picture/delete', {
          method: 'DELETE',
          credentials: 'include',
        });
      }
      setNoImage(true);
      setProfilePic(initialImagePath);
      setUploadError(null);
    } catch (error) {
      console.error('Delete error:', error);
      setUploadError('Failed to delete profile picture');
    }
  };

  const handleChangeProfilePic = () => {
    document.getElementById('pfpFileInput').click();
  };

  const handleAddProfilePic = () => {
    document.getElementById('pfpFileInput').click();
  };

  return {
    profilePic,
    noImage,
    uploading,
    uploadError,
    handleFileSelect,
    handleDeleteProfilePic,
    handleChangeProfilePic,
    handleAddProfilePic,
    setProfilePic,
    setNoImage,
  };
};
