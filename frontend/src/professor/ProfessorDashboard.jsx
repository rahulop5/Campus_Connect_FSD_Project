import React, { useEffect, useState } from "react";
import CourseList from "./CourseList";
import FileUploader from "./FileUploader";
import api from "../api/axios"; // Use configured axios instance

export default function ProfessorDashboard() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchCourses() {
      try {
        setLoading(true);
        const response = await api.get("/prof/courses");
        console.log("Courses data:", response.data);
        setCourses(response.data.courses || []);
        if (response.data.courses && response.data.courses.length > 0) {
          setSelectedCourse(response.data.courses[0].id);
        }
        setLoading(false);
      } catch (err) {
        console.error("Error fetching courses:", err);
        setError(err.message || "Failed to load courses");
        setLoading(false);
      }
    }
    fetchCourses();
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    if (!selectedCourse) return alert("Please select a course.");
    if (!file) return alert("Please upload a .csv file.");

    const formData = new FormData();
    formData.append("courseId", selectedCourse);
    formData.append("csvFile", file);

    console.log("Submitting with selectedCourse:", selectedCourse);
    console.log("Available courses:", courses.map(c => ({ id: c.id, name: c.name })));

    api.post("/prof/upload-csv", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    })
      .then((res) => {
        console.log("Upload response:", res.data);
        alert("Successfully done!");
        window.location.reload();
      })
      .catch((err) => {
        console.error("Upload error:", err);
        alert("An error occurred. Please try again.");
      });
  }

  const professor = (typeof window !== "undefined" && window.__PROFESSOR__) || {};

  if (loading) return <div className="loading-placeholder">Loading...</div>;
  if (error) return <div className="error-placeholder">Error: {error}</div>;
  if (courses.length === 0) return <div className="error-placeholder">No courses assigned to you.</div>;

  return (
    <div className="dashboard-wrapper">
      <p className="dashboard-title">Dashboard</p>

      <h1>hello</h1>

      <div className="welcome-text">
        <p>
          <span className="gradient-text">Welcome back,</span>
          <br />
          <span className="prof-light">Dr.</span>
          <span className="prof-bold"> {professor.name || "Professor"} </span>
        </p>
      </div>

      <form id="marksUploadForm" className="marks-upload-form" onSubmit={handleSubmit}>
        <div className="courses-selection-container">
          <p className="assigned-courses-title">Assigned Courses:</p>
          <CourseList courses={courses} onSelect={setSelectedCourse} selected={selectedCourse} />
        </div>

        <div className="upload-container">
          <p className="upload-title">Upload page:</p>
          <FileUploader onFileChange={setFile} />

          <div className="upload-footer" style={{ marginTop: 12 }}>
            <button className="submit-btn" type="submit">
              <span className="submit-text">Submit</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}