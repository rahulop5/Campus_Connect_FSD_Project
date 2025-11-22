import React, { useState, useEffect } from 'react';
import '../../public/styles/profile.css';
import { useEditableField, useProfilePicture } from '../shared/useProfileHooks';
// import { profileService } from '../shared/profileService';
import ProfilePicture from '../shared/ProfilePicture';
import ProfileField from '../shared/ProfileField';
import ProfessorCourses from './ProfessorCourses';
import BackgroundSVG from '../shared/BackgroundSVG';
import LoadingState from '../shared/LoadingState';
import ErrorState from '../shared/ErrorState';

const ProfessorProfile = () => {
  const [profileData, setProfileData] = useState({
    name: 'Dr. James Smith',
    email: 'james@example.com',
    password: '••••••••••••••••••',
    phone: '9876543210',
  });

  const [courses, setCourses] = useState([
    { name: 'CCN', year: '2' },
    { name: 'ACS', year: '2' },
    { name: 'SE', year: '2' },
  ]);

  const [additionalCourses, setAdditionalCourses] = useState([
    { name: 'ToC', year: '2' },
    { name: 'FComm', year: '2' },
  ]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingField, setSavingField] = useState(null);

  const nameField = useEditableField('name', profileData.name);
  const phoneField = useEditableField('phone', profileData.phone);
  const profilePicture = useProfilePicture('./assets/prof_pfp.jpg');

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        const data = await profileService.fetchProfessorProfile();

        setProfileData({
          name: data.name || profileData.name,
          email: data.email || profileData.email,
          password: '••••••••••••••••••',
          phone: data.phone || profileData.phone,
        });

        if (data.courses && data.courses.length > 0) {
          const formattedCourses = data.courses.map(courseObj => ({
            name: courseObj.course?.name || 'Unnamed',
            year: courseObj.course?.year || courseObj.course?.ug || '2'
          }));
          setCourses(formattedCourses);
        }

        if (data.profilePicture) {
          profilePicture.setProfilePic(data.profilePicture);
        }

        setError(null);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile data. Using default values.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  const handleSaveField = async (field, value) => {
    try {
      setSavingField(field);
      await profileService.updateProfileField(field, value);

      setProfileData(prev => ({
        ...prev,
        [field]: value
      }));
    } catch (err) {
      console.error(`Error updating ${field}:`, err);
      alert(`Failed to update ${field}. Please try again.`);
    } finally {
      setSavingField(null);
    }
  };

  const handleInputChange = (field, value) => {
    if (field === 'name') {
      nameField.handleChange(value);
    } else if (field === 'phone') {
      phoneField.handleChange(value);
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={() => window.location.reload()} />;

  return (
    <div className="bodyContainer">
      <div className="form">
        <div className="header">
          <div id="my_profile1" className="my_profile">M Y</div>
          <div id="my_profile2" className="my_profile">P R O F I L E</div>
        </div>

        <div className="contentWrapper">
          <ProfilePicture
            profilePic={profilePicture.profilePic}
            noImage={profilePicture.noImage}
            onFileSelect={profilePicture.handleFileSelect}
            onChangeClick={profilePicture.handleChangeProfilePic}
            onDeleteClick={profilePicture.handleDeleteProfilePic}
            onAddClick={profilePicture.handleAddProfilePic}
          />

          <BackgroundSVG />

          <ProfileField
            label="Name"
            value={nameField.value}
            isEditing={nameField.isEditing}
            onEdit={nameField.handleEditClick}
            onSave={() => nameField.handleCheckClick(() => handleSaveField('name', nameField.value))}
            onChange={(val) => handleInputChange('name', val)}
          />

          <div className="auth_qa" id="second_auth">
            <div className="auth_q">Email</div>
            <div className="auth_a"><div>{profileData.email}</div></div>
          </div>

          <div className="auth_qa" id="third_auth">
            <div className="auth_q">Password</div>
            <div className="auth_a">
              <div>
                <input type="text" value={profileData.password} readOnly className="editable-input" />
              </div>
              <div className="image_div">
                <img className="edit_mark" src="./assets/edit-text 2.png" alt="edit password" onClick={() => nameField.handleEditClick()} />
              </div>
            </div>
          </div>

          <ProfileField
            label="Phone Number"
            value={phoneField.value}
            isEditing={phoneField.isEditing}
            onEdit={phoneField.handleEditClick}
            onSave={() => phoneField.handleCheckClick(() => handleSaveField('phone', phoneField.value))}
            onChange={(val) => handleInputChange('phone', val)}
          />

          <ProfessorCourses courses={courses} additionalCourses={additionalCourses} />
        </div>
      </div>
    </div>
  );
};

export default ProfessorProfile;