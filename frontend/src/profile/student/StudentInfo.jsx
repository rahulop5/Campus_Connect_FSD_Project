import React from 'react';

const StudentInfo = ({ branch, year, section, roll }) => {
  return (
    <div id="rb_row1">
      <div className="rb_r1_col">
        <div className="rb_r1_q">Branch</div>
        <div className="rb_r1_a">{branch}</div>
      </div>
      <div className="rb_r1_col">
        <div className="rb_r1_q">Year</div>
        <div className="rb_r1_a">UG{year}</div>
      </div>
      <div className="rb_r1_col">
        <div className="rb_r1_q">Section</div>
        <div className="rb_r1_a">{section}</div>
      </div>
    </div>
  );
};

export default StudentInfo;
