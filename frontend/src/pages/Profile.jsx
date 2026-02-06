import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import api from '../api/axios';
import Header from '../components/Header';
import DarkVeil from '../components/DarkVeil';
import '../styles/profile.css';

const Profile = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({});
  const fileInputRef = useRef(null);
  const [pfp, setPfp] = useState("/assets/pfp 1.png");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/student/profile');
        setStudent(res.data.student);
        setFormData(res.data.student);
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };
    fetchProfile();
  }, []);

  const handleEdit = (field) => {
    if (editing === field) {
      api.post('/student/update', { field, value: formData[field] })
        .then(() => {
          setEditing(null);
          setStudent(prev => ({ ...prev, [field]: formData[field] }));
        })
        .catch(err => console.error("Error updating:", err));
    } else {
      setEditing(field);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePfpChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
        // Preview the image immediately
        const reader = new FileReader();
        reader.onload = (e) => {
            setPfp(e.target.result);
        };
        reader.readAsDataURL(file);
        
        // Upload to backend
        const formData = new FormData();
        formData.append('profilePicture', file);
        
        try {
            const res = await api.post('/student/upload-profile-pic', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            console.log('Profile picture uploaded:', res.data);
        } catch (error) {
            console.error('Error uploading profile picture:', error);
            alert('Failed to upload profile picture');
        }
    }
  };

  const handleDeletePfp = async () => {
    try {
        await api.post('/student/delete-profile-pic');
        setPfp("/assets/pfp 1.png");
    } catch (error) {
        console.error('Error deleting profile picture:', error);
    }
  };

  if (!student) return <div>Loading...</div>;

  return (
    <>
      <div className="plasma-background">
        <DarkVeil hueShift={120} speed={0.5} noiseIntensity={0.8} />
      </div>
      <Header />
      <div className="profile-page">
        <form id="bodbod" onSubmit={(e) => e.preventDefault()}>
            <div>
                <div id="my_profile1" className="my_profile">M Y</div>
                <div id="my_profile2" className="my_profile">P R O F I L E</div>
            </div>
            
            <div className='profile_form' >
                <div className="auth_qa" id="first_auth">
                    <div className="auth_q">Name</div>
                    <div className="auth_a">
                        <div>
                            <input 
                                type="text" 
                                name="name" 
                                value={formData.name || ''} 
                                readOnly={editing !== 'name'}
                                onChange={handleChange}
                                className={editing === 'name' ? 'editable-input editing' : 'editable-input'}
                                maxLength={300}
                            />
                        </div>
                        <div className="image_div">
                            <img 
                                className="edit_mark" 
                                src={editing === 'name' ? "/assets/check.png" : "/assets/edit-text 2.png"} 
                                alt="edit name" 
                                onClick={() => handleEdit('name')}
                            />
                        </div>
                    </div>    
                </div>

                <div className="auth_qa" id="second_auth">
                    <div className="auth_q">Email</div>
                    <div className="auth_a"><div>{student.email}</div></div>    
                </div>

                <div className="auth_qa" id="third_auth">
                    <div className="auth_q">Password</div>
                    <div className="auth_a">
                        <div><input type="text" value="••••••••••••••••••" readOnly className="editable-input" /></div>
                        <div className="image_div"><img className="edit_mark" src="/assets/edit-text 2.png" alt="edit password" onClick={() => navigate('/change-password')} /></div>
                    </div>    
                </div>

                <div className="auth_qa" id="fourth_auth">
                    <div className="auth_q">Phone Number</div>
                    <div className="auth_a">
                        <div>
                            <input 
                                type="tel" 
                                name="phone" 
                                value={formData.phone || ''} 
                                readOnly={editing !== 'phone'}
                                onChange={handleChange}
                                className={editing === 'phone' ? 'editable-input editing' : 'editable-input'}
                                pattern="[0-9]{10}"
                                title="10 digit mobile number"
                                maxLength={300}
                            />
                        </div>
                        <div className="image_div">
                            <img 
                                className="edit_mark" 
                                src={editing === 'phone' ? "/assets/check.png" : "/assets/edit-text 2.png"} 
                                alt="edit phone" 
                                onClick={() => handleEdit('phone')}
                            />
                        </div>
                    </div>    
                </div>

                <div className="auth_qa" id="fifth_auth">
                    <div className="auth_q">Roll Number</div>
                    <div className="auth_a"><div>{student.roll}</div></div>    
                </div>

                <div id="rb_row1">
                    <div className="rb_r1_col">
                        <div className="rb_r1_q">Branch</div>
                        <div className="rb_r1_a">{student.branch}</div>
                    </div>
                    <div className="rb_r1_col">
                        <div className="rb_r1_q">Year</div>
                        <div className="rb_r1_a">UG{student.ug}</div>
                    </div>
                    <div className="rb_r1_col">
                        <div className="rb_r1_q">Section</div>
                        <div className="rb_r1_a">{student.section}</div>
                    </div>
                </div>

                <div id="rb_row2">
                    <div className="rb_r2_q">Courses Enrolled</div>
                    <div id="rb_r2_course_r1">
                        {student.courses && student.courses.length > 0 ? (
                            student.courses.map((course, idx) => {
                                const shortform = course.course.name.split(" ").map(w => w[0].toUpperCase()).join("");
                                return <div key={idx}>{shortform}</div>;
                            })
                        ) : (
                            <div>No courses enrolled</div>
                        )}
                    </div>
                    <div id="rb_r2_course_r2">
                        <div>-</div>
                    </div>
                </div>

                <div id="seperator_line"></div>
                <div id="l_row1">
                    <div className="l_r1_col" id="l_r1_c1">
                        <div className="l_r1_col_q">Upvotes</div>
                        <div className="l_r1_col_aimg">
                            <div className="l_r1_col_a">0</div>
                            <div className="l_r1_col_img"><img src="/assets/arrow (1) 1.png" alt="upvote icon" /></div>
                        </div>
                    </div>
                    <div className="l_r1_col" id="l_r1_c2">
                        <div className="l_r1_col_q">Echelons</div>
                        <div className="l_r1_col_aimg">
                            <div id="echelons_a" className="l_r1_col_a">0</div>
                            <div className="l_r1_col_img"><img src="/assets/star 1.png" alt="echelons icon" /></div>
                        </div>
                    </div>
                </div>
                <div id="l_row2">
                    <div className="l_r2_col" id="l_r2_c1">
                        <div className="l_r2_col_q">Total Questions Asked</div>
                        <div className="l_r2_col_aimg"><div className="l_r2_col_a">0</div></div>
                    </div>
                    <div className="l_r2_col" id="l_r2_c2">
                        <div className="l_r2_col_q">Total Questions Answered</div>
                        <div className="l_r2_col_aimg"><div className="l_r2_col_a">0</div></div>
                    </div>
                </div>

                <div className="pfp-container" id="pfpContainer">
                    <input type="file" id="pfpFileInput" accept="image/*" hidden ref={fileInputRef} onChange={handlePfpChange} />
                    <img id="profilePic" src={pfp} alt="Profile Picture" />
                    <div className="pfp-overlay">
                        <div className="pfp-btn" id="changeBtn" onClick={() => fileInputRef.current.click()} title="Change Picture"></div>
                        <div className="pfp-btn" id="deleteBtn" onClick={handleDeletePfp} title="Delete Picture"></div>
                        <div className="pfp-btn" id="addBtn" onClick={() => fileInputRef.current.click()} title="Add Picture"></div>
                    </div>
                </div>

                <svg className="profile-bg-svg" xmlns="http://www.w3.org/2000/svg" width="880" height="520" viewBox="0 0 880 520" fill="none">
                    <foreignObject x="-4" y="-4" width="888" height="528"><div xmlns="http://www.w3.org/1999/xhtml" style={{backdropFilter:'blur(2px)', clipPath:'url(#bgblur_0_646_878_clip_path)', height:'100%', width:'100%'}}></div></foreignObject><g data-figma-bg-blur-radius="4">
                    <mask id="path-1-inside-1_646_878" fill="white">
                        <path fillRule="evenodd" clipRule="evenodd" d="M880 40C880 17.9086 862.091 0 840 0H490C467.909 0 450 17.9086 450 40V230C450 252.091 432.091 270 410 270H40C17.9086 270 0 287.909 0 310V480C0 502.091 17.9086 520 40 520H840C862.091 520 880 502.091 880 480V270V40Z"/>
                    </mask>
                    <path fillRule="evenodd" clipRule="evenodd" d="M880 40C880 17.9086 862.091 0 840 0H490C467.909 0 450 17.9086 450 40V230C450 252.091 432.091 270 410 270H40C17.9086 270 0 287.909 0 310V480C0 502.091 17.9086 520 40 520H840C862.091 520 880 502.091 880 480V270V40Z" fill="#1F1F1F" fillOpacity="0.6"/>
                    <path d="M490 1H840V-1H490V1ZM451 230V40H449V230H451ZM40 271H410V269H40V271ZM1 480V310H-1V480H1ZM840 519H40V521H840V519ZM879 270V480H881V270H879ZM879 40V270H881V40H879ZM840 521C862.644 521 881 502.644 881 480H879C879 501.539 861.539 519 840 519V521ZM-1 480C-1 502.644 17.3563 521 40 521V519C18.4609 519 1 501.539 1 480H-1ZM40 269C17.3563 269 -1 287.356 -1 310H1C1 288.461 18.4609 271 40 271V269ZM449 230C449 251.539 431.539 269 410 269V271C432.644 271 451 252.644 451 230H449ZM840 1C861.539 1 879 18.4609 879 40H881C881 17.3563 862.644 -1 840 -1V1ZM490 -1C467.356 -1 449 17.3563 449 40H451C451 18.4609 468.461 1 490 1V-1Z" fill="#373737" mask="url(#path-1-inside-1_646_878)"/>
                    </g>
                    <defs>
                    <clipPath id="bgblur_0_646_878_clip_path" transform="translate(4 4)"><path fillRule="evenodd" clipRule="evenodd" d="M880 40C880 17.9086 862.091 0 840 0H490C467.909 0 450 17.9086 450 40V230C450 252.091 432.091 270 410 270H40C17.9086 270 0 287.909 0 310V480C0 502.091 17.9086 520 40 520H840C862.091 520 880 502.091 880 480V270V40Z"/>
                    </clipPath></defs>
                </svg>
            </div>
        </form>
      </div>
    </>
  );
};

export default Profile;
