import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '../api/axios';
import Layout from '../components/Layout';
import DarkVeil from '../components/DarkVeil';
import '../styles/Academics.css';

const Academics = () => {
  const { user } = useSelector((state) => state.auth);
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [uploadType, setUploadType] = useState('attendance'); // 'attendance' or 'marks'
  const [file, setFile] = useState(null);
  const [csvPreview, setCsvPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

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
        setMessage("Invalid file type. Please upload a .csv file.");
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
      const data = rows.slice(1, 6).map(row => row.split(",").map(cell => cell.trim()));
      
      setCsvPreview({ headers, data });
    };
    reader.readAsText(file);
  };

  const removeFile = () => {
    setFile(null);
    setCsvPreview(null);
    const fileInput = document.getElementById('csvFile');
    if (fileInput) fileInput.value = null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedCourseId) {
      setMessage("Please select a course.");
      return;
    }
    
    if (!file) {
      setMessage("Please upload a CSV file.");
      return;
    }

    setUploading(true);
    setMessage('');
    
    const formData = new FormData();
    formData.append('courseId', selectedCourseId);
    formData.append('uploadType', uploadType);
    formData.append('csvFile', file);

    try {
      const response = await api.post('/professor/upload-csv', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setMessage(response.data.message || "CSV uploaded successfully!");
      removeFile();
      setSelectedCourseId('');
    } catch (error) {
      console.error("Error uploading CSV:", error);
      setMessage(error.response?.data?.message || "An error occurred while uploading.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Layout>
      <div className="academics-page">
        <div className="plasma-background">
          <DarkVeil hueShift={120} speed={0.5} noiseIntensity={0.8} />
        </div>

        <div className="academics-container">
          <div className="academics-header">
            <h1>Academics Management</h1>
            <p>Upload CSV files to update attendance or marks for your courses</p>
          </div>

          <form onSubmit={handleSubmit} className="academics-form">
            <div className="form-section">
              <label>Upload Type</label>
              <div className="upload-type-selector">
                <button
                  type="button"
                  className={uploadType === 'attendance' ? 'active' : ''}
                  onClick={() => setUploadType('attendance')}
                >
                  Attendance
                </button>
                <button
                  type="button"
                  className={uploadType === 'marks' ? 'active' : ''}
                  onClick={() => setUploadType('marks')}
                >
                  Marks
                </button>
              </div>
            </div>

            <div className="form-section">
              <label htmlFor="course">Select Course</label>
              <select
                id="course"
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                required
              >
                <option value="">-- Choose a course --</option>
                {courses.map((course) => (
                  <option key={course._id} value={course._id}>
                    {course.courseCode} - {course.courseName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-section">
              <label htmlFor="csvFile">Upload CSV File</label>
              <div className="file-upload-area">
                <input
                  type="file"
                  id="csvFile"
                  accept=".csv"
                  onChange={handleFileChange}
                  required
                />
                {file && (
                  <div className="file-info">
                    <span className="file-name">{file.name}</span>
                    <button type="button" onClick={removeFile} className="remove-btn">
                      Remove
                    </button>
                  </div>
                )}
              </div>
              <p className="file-hint">
                {uploadType === 'attendance' 
                  ? 'CSV format: Roll Number, Name, Attended, Total'
                  : 'CSV format: Roll Number, Name, Marks, Max Marks'}
              </p>
            </div>

            {csvPreview && (
              <div className="csv-preview">
                <h3>Preview (First 5 rows)</h3>
                <div className="preview-table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        {csvPreview.headers.map((header, idx) => (
                          <th key={idx}>{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {csvPreview.data.map((row, rowIdx) => (
                        <tr key={rowIdx}>
                          {row.map((cell, cellIdx) => (
                            <td key={cellIdx}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {message && (
              <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
                {message}
              </div>
            )}

            <button type="submit" className="submit-btn" disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload CSV'}
            </button>
          </form>

          <div className="info-card">
            <h3>CSV Format Guidelines</h3>
            <div className="guideline-section">
              <h4>For Attendance:</h4>
              <code>Roll Number,Name,Attended,Total</code>
              <p>Example: 21BCS001,John Doe,28,30</p>
            </div>
            <div className="guideline-section">
              <h4>For Marks:</h4>
              <code>Roll Number,Name,Marks,Max Marks</code>
              <p>Example: 21BCS001,John Doe,85,100</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Academics;
