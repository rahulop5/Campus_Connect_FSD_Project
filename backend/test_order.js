import axios from 'axios';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const token = jwt.sign(
  { id: "652427f7f9b8c34f8a000000", role: "student", instituteId: "652427f7f9b8c34f8a000001" },
  process.env.JWT_SECRET,
  { expiresIn: "1h" }
);

async function run() {
  try {
    const res = await axios.post('http://localhost:3000/api/payment/create-order', {
      planId: 'student_collective'
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log("Success:\n", JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error("Error creating order:\n", JSON.stringify(err.response?.data || err.message, null, 2));
  }
}

run();
