export const profileService = {
  fetchStudentProfile: async () => {
    try {
      const response = await fetch('/profile', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch profile: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching student profile:', error);
      throw error;
    }
  },

  fetchProfessorProfile: async () => {
    try {
      const response = await fetch('/profile', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch profile: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching professor profile:', error);
      throw error;
    }
  },

  updateProfileField: async (field, value) => {
    try {
      const response = await fetch('/profile/update', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ field, value })
      });

      if (!response.ok) {
        throw new Error(`Failed to update field: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
      throw error;
    }
  },

  uploadProfilePicture: async (file) => {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/profile/picture/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Failed to upload picture: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      throw error;
    }
  },

  deleteProfilePicture: async () => {
    try {
      const response = await fetch('/profile/picture/delete', {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to delete picture: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting profile picture:', error);
      throw error;
    }
  },

  uploadProfilePictureBase64: async (base64Data, fileName = 'profile.jpg') => {
    try {
      const response = await fetch('/profile/picture/upload-base64', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: base64Data,
          fileName: fileName
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to upload picture: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      throw error;
    }
  }
};
