import React from 'react';

const StudentCourses = ({ courses, additionalCourses }) => {
  return (
    <div id="rb_row2">
      <div className="rb_r2_q">Courses Enrolled</div>
      <div id="rb_r2_course_r1">
        {courses.map((course, idx) => (
          <div key={idx}>{course}</div>
        ))}
      </div>
      <div id="rb_r2_course_r2">
        {additionalCourses.length > 0 ? (
          additionalCourses.map((course, idx) => (
            <div key={idx}>{course}</div>
          ))
        ) : (
          <div>-</div>
        )}
      </div>
    </div>
  );
};

export default StudentCourses;
