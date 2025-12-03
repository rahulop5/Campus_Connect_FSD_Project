import React, { useState, useEffect } from 'react';
import '../../public/styles/profile.css';
import { useEditableField, useProfilePicture } from '../shared/useProfileHooks';
import ProfilePicture from '../shared/ProfilePicture';
import ProfileField from '../shared/ProfileField';
import ProfileStats from './ProfileStats';
import StudentCourses from './StudentCourses';
import StudentInfo from './StudentInfo';
import BackgroundSVG from '../shared/BackgroundSVG';
import LoadingState from '../shared/LoadingState';
import ErrorState from '../shared/ErrorState';

const StudentProfile = () => {
  const [profileData, setProfileData] = useState({
    name: 'John Doe',
    email: 'john@example.com',
    password: '••••••••••••••••••',
    phone: '9876543210',
    roll: 'A123',
    branch: 'CSE',
    ug: '2',
    section: 'A',
  });

  const [courses, setCourses] = useState(['FFSD', 'CCN', 'ACS']);
  const [additionalCourses, setAdditionalCourses] = useState(['AI', 'TOC']);
  const [stats, setStats] = useState({
    upvotes: 103,
    echelons: 72,
    questionsAsked: 23,
    questionsAnswered: 19,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingField, setSavingField] = useState(null);

  const nameField = useEditableField('name', profileData.name);
  const phoneField = useEditableField('phone', profileData.phone);
  const profilePicture = useProfilePicture('./assets/pfp 1.png');

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        const data = await profileService.fetchStudentProfile();

        setProfileData({
          name: data.name || profileData.name,
          email: data.email || profileData.email,
          password: '••••••••••••••••••',
          phone: data.phone || profileData.phone,
          roll: data.roll || profileData.roll,
          branch: data.branch || profileData.branch,
          ug: data.ug || profileData.ug,
          section: data.section || profileData.section,
        });

        if (data.courses && data.courses.length > 0) {
          setCourses(data.courses.map(c => {
            if (c.course && c.course.name) {
              return c.course.name
                .split(' ')
                .map(word => word[0].toUpperCase())
                .join('');
            }
            return c;
          }));
        }

        if (data.additionalCourses && data.additionalCourses.length > 0) {
          setAdditionalCourses(data.additionalCourses.map(c => c.course?.name || 'Unnamed'));
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

          <div className="auth_qa" id="fifth_auth">
            <div className="auth_q">Roll Number</div>
            <div className="auth_a"><div>{profileData.roll}</div></div>
          </div>

          <StudentInfo branch={profileData.branch} year={profileData.ug} section={profileData.section} roll={profileData.roll} />
          <StudentCourses courses={courses} additionalCourses={additionalCourses} />
          <div id="seperator_line" />
          <ProfileStats upvotes={stats.upvotes} echelons={stats.echelons} questionsAsked={stats.questionsAsked} questionsAnswered={stats.questionsAnswered} />
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
