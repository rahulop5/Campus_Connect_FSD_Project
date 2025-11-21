import React, { useEffect, useState } from "react";
import CourseList from "./CourseList";
import FileUploader from "./FileUploader";

export default function ProfessorDashboard() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function temp(){

      setLoading(true);
      fetch("http://localhost:3000/api/prof/courses")
      .then((res) => res.json())
      .then((data) => {
        console.log(data)
        setCourses(data.courses || []);
        if (data.courses && data.courses.length > 0) {
          setSelectedCourse(data.courses[0].id);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
    }
    temp();
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    if (!selectedCourse) return alert("Please select a course.");
    if (!file) return alert("Please upload a .csv file.");

    const formData = new FormData();
    formData.append("courseId", selectedCourse);
    formData.append("marksheet", file);

    fetch("/prof/submit", { method: "POST", body: formData })
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        alert("Successfully done!");
        window.location.reload();
      })
      .catch(() => alert("An error occurred. Please try again."));
  }

  const professor = (typeof window !== "undefined" && window.__PROFESSOR__) || {};

  if (loading) return <div className="loading-placeholder">Loading...</div>;
  if (error) return <div className="error-placeholder">Error: {error}</div>;

  return (
    <div className="dashboard-wrapper">
      <p className="dashboard-title">Dashboard</p>

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