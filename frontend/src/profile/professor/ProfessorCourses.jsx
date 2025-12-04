import React from 'react';

const ProfessorCourses = ({ courses, additionalCourses }) => {
  return (
    <>
      <div id="l_row1" className="coursesHeader">
        <div className="rb_r2_q">Courses Alloted</div>
      </div>

      <div id="l_row2" className="coursesContainer">
        <div id="rb_r2_course_r1">
          {courses.map((course, idx) => (
            <div key={idx}>
              {course.name}&nbsp;&nbsp;<span className="year">UG<span id="greenColor">{course.year}</span></span>
            </div>
          ))}
        </div>
      </div>

      <div id="l_row3" className="coursesContainer">
        <div id="rb_r2_course_r1">
          {additionalCourses.map((course, idx) => (
            <div key={idx}>
              {course.name}&nbsp;&nbsp;<span className="year">UG<span id="greenColor">{course.year}</span></span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default ProfessorCourses;
