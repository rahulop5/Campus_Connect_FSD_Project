import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Layout from '../components/Layout';
import '../styles/Profdashboard.css';

const ProfessorDashboard = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [file, setFile] = useState(null);
  const [csvPreview, setCsvPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get('/professor/courses');
        setCourses(res.data.courses || []);
      } catch (error) {
        console.error("Error fetching courses:", error);
      }
    };
    fetchCourses();
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        alert("Invalid file type. Please upload a .csv file.");
        e.target.value = null;
        return;
      }
      setFile(selectedFile);
      generatePreview(selectedFile);
    }
  };

  const generatePreview = (file) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const csvContent = event.target.result;
      const rows = csvContent.trim().split("\n");
      if (rows.length === 0) return;
      
      const headers = rows[0].split(",").map(h => h.trim());
      const data = rows.slice(1, 6).map(row => row.split(",").map(cell => cell.trim())); // Preview first 5 rows
      
      setCsvPreview({ headers, data });
    };
    reader.readAsText(file);
  };

  const removeFile = () => {
    setFile(null);
    setCsvPreview(null);
    document.getElementById('file').value = null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedCourseId) {
      alert("Please select a course.");
      return;
    }
    
    if (!file) {
      alert("Please upload a marksheet file.");
      return;
    }

    setUploading(true);
    
    const formData = new FormData();
    formData.append('courseId', selectedCourseId);
    formData.append('marksheet', file);

    try {
      const response = await fetch('http://localhost:3000/prof/submit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        alert("Marksheet submitted successfully!");
        removeFile();
        setSelectedCourseId(null);
      } else {
        const errorText = await response.text();
        alert(`Error: ${errorText}`);
      }
    } catch (error) {
      console.error("Error submitting marks:", error);
      alert("An error occurred while submitting. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Layout>
      <div className="dashboard-wrapper prof-dashboard-page">
        <p className="dashboard-title">Dashboard</p>
        
        <div className="welcome-text">
          <p>
            <span className="gradient-text">Welcome back,</span><br />
            <span className="prof-light">Dr.</span>
            <span className="prof-bold"> {user?.name || 'Professor'} </span>
          </p>
        </div>
        
        <form id="marksUploadForm" onSubmit={handleSubmit} className="marks-upload-form">
          <div className="courses-selection-container">
            <p className="assigned-courses-title">Assigned Courses:</p>
            <div id="coursesContainer" className="assigned-courses-box">
              {courses.length > 0 ? (
                courses.map(course => (
                  <label key={course.id} className="course-box-label">
                    <input 
                      type="radio" 
                      name="courseId" 
                      value={course.id} 
                      className="hidden-radio"
                      onChange={() => setSelectedCourseId(course.id)}
                      checked={selectedCourseId === course.id}
                    />
                    <div className={`course-box ${selectedCourseId === course.id ? 'selected' : ''}`}>
                      <div className="course-code">{course.name}</div>
                      <div className="course-section">
                        <img src="/assets/section-icon.png" alt="Section" className="section-icon" />
                        <span>Sec-{course.section}</span>
                      </div>
                    </div>
                  </label>
                ))
              ) : (
                <p>No assigned courses available.</p>
              )}
            </div>
          </div>

          <div className="upload-container">
            <p className="upload-title">Upload page:</p>
            <div className="upload-box-wrapper">
              <div className="upload-main-content">
                <div className="file-upload">
                  <input
                    type="file"
                    id="file"
                    className="hidden-file"
                    accept=".csv"
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                  <label htmlFor="file" className={`custom-file-label ${file ? 'file-uploaded' : ''}`}>
                    <div className="upload-content">
                      {file ? (
                        <>
                          <div className="file-uploaded-icon"></div>
                          <div className="file-display">
                            <p className="file-name" title={file.name}>{file.name}</p>
                            <button 
                              type="button" 
                              className="remove-file-btn" 
                              onClick={(e) => { e.preventDefault(); removeFile(); }}
                            >
                              ✕
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="upload-icon"></div>
                          <div className="upload-text">
                            <p>Drag & drop files here</p>
                            <span>or</span>
                            <p className="browse-files">Browse files</p>
                          </div>
                        </>
                      )}
                    </div>
                  </label>
                </div>
                
                {csvPreview && (
                  <div id="csvPreviewContainer" className="csv-preview-container" style={{ display: 'flex' }}>
                    <p className="preview-title">File Preview (first 5 rows)</p>
                    <div className="csv-preview-table-wrapper">
                      <table id="csvPreviewTable">
                        <thead>
                          <tr>
                            {csvPreview.headers.map((h, i) => <th key={i}>{h}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {csvPreview.data.map((row, i) => (
                            <tr key={i}>
                              {row.map((cell, j) => <td key={j}>{cell}</td>)}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div className="upload-footer">
                <div className="file-note-wrapper">
                  <img src="/assets/warn7.png" alt="Warning" className="warning-icon" />
                  <div className="note-text-content">
                    <p className="file-note">Note:</p>
                    <p className="file-note1">Only .csv supported</p>
                  </div>
                </div>
                <button className="submit-btn" type="submit" disabled={uploading}>
                  <span className="submit-text">{uploading ? 'Submitting...' : 'Submit'}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default ProfessorDashboard;
