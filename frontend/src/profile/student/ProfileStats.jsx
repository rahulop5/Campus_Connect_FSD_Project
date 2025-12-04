import React from 'react';

const ProfileStats = ({ upvotes, echelons, questionsAsked, questionsAnswered }) => {
  return (
    <>
      <div id="l_row1">
        <div className="l_r1_col" id="l_r1_c1">
          <div className="l_r1_col_q">Upvotes</div>
          <div className="l_r1_col_aimg">
            <div className="l_r1_col_a">{upvotes}</div>
            <div className="l_r1_col_img">
              <img src="./assets/arrow (1) 1.png" alt="upvote icon" />
            </div>
          </div>
        </div>
        <div className="l_r1_col" id="l_r1_c2">
          <div className="l_r1_col_q">Echelons</div>
          <div className="l_r1_col_aimg">
            <div id="echelons_a" className="l_r1_col_a">
              {echelons}
            </div>
            <div className="l_r1_col_img">
              <img src="./assets/star 1.png" alt="echelons icon" />
            </div>
          </div>
        </div>
      </div>+

      <div id="l_row2">3
        <div className="l_r2_col" id="l_r2_c1">
          <div className="l_r1_col_q">Total Questions Asked</div>
          <div className="l_r2_col_aimg">
            <div className="l_r2_col_a">{questionsAsked}</div>
          </div>
        </div>
        <div className="l_r2_col" id="l_r2_c2">
          <div className="l_r1_col_q">Total Questions Answered</div>
          <div className="l_r2_col_aimg">
            <div className="l_r2_col_a">{questionsAnswered}</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileStats;
