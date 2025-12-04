import React from "react";

export default function CourseList({ courses, onSelect, selected }) {
  if (!courses || courses.length === 0) return <p>No assigned courses available.</p>;
  return (
    <div className="assigned-courses-box">
      {courses.map((course) => (
        <label className="course-box-label" key={course.id}>
          <input
            type="radio"
            name="courseId"
            value={course.id}
            className="hidden-radio"
            checked={selected === course.id}
            onChange={() => onSelect(course.id)}
          />
          <div className="course-box">
            <div className="course-code">{course.name}</div>
            <div className="course-section">
              <img src="/assets/section-icon.png" alt="Section" className="section-icon" />
              <span>Sec-{course.section}</span>
            </div>
          </div>
        </label>
      ))}
    </div>
  );
}
