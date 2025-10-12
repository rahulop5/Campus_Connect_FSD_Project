# 🎓 Campus Connect

> A full-stack campus management and collaboration platform built for **students**, **professors**, and **administrators** — integrating Q&A forums, attendance tracking, predictive analytics, and seamless user management.

---

## 🚀 Project Overview

**Campus Connect** is a comprehensive full-stack web application designed to revolutionize campus life for students, professors, and administrators.
Inspired by platforms like **Stack Overflow**, it creates a collaborative ecosystem where students can post questions, seek answers from peers and faculty, track attendance, and visualize academic performance through predictive **bell curve graphs**.

Built with modern web technologies, **Campus Connect** emphasizes **role-based access control**, **seamless user management**, and **intuitive dashboards** to foster engagement and efficiency in educational environments.

---

### 🎯 Key Features

* 🗣️ **Q&A Forum** – Students can post course-related questions and receive answers from peers or professors, with upvoting and threading (enhancements planned).
* 🧮 **Attendance Tracking** – Real-time monitoring with percentage calculations and historical views per course.
* 📈 **Bell Graph Prediction** – Visualize class performance distributions and predict grades via z-score analysis.
* 👥 **Role-Based User Management**

  * **Admins:** Full CRUD on users and courses, assign/unassign professors, bulk removals.
  * **Professors:** Upload marks (CSV), manage attendance, and engage in Q&A.
  * **Students:** Enroll in courses, participate in discussions, view stats, and track progress.
* 🔒 **Secure Authentication** – Session-based login using Passport.js with bcrypt hashing and optional OAuth.
* ✅ **Data Integrity** – Duplicate prevention (unique emails, roll numbers), schema validation, and atomic DB updates.
* 💻 **Responsive Dashboards** – EJS-templated dynamic interfaces for each user type.

---

## 🧠 Tech Stack

| Layer               | Technology                           |
| ------------------- | ------------------------------------ |
| **Frontend**        | EJS Templates, HTML, CSS, JavaScript |
| **Backend**         | Node.js, Express.js                  |
| **Database**        | MongoDB (via Mongoose)               |
| **Authentication**  | Passport.js, bcrypt                  |
| **File Handling**   | Multer                               |
| **Templating**      | EJS                                  |
| **Version Control** | Git & GitHub                         |

---

## 🧱 Project Structure

```
Campus_Connect_FSD_Project/
├── config/            # Database, Multer, and Passport configurations
├── controllers/       # Request handlers and business logic
├── models/            # Mongoose schemas (Admin, Student, Professor, etc.)
├── public/            # Static files (CSS, JS, images)
│   ├── assets/
│   ├── scripts/
│   └── styles/
├── routes/            # Express route definitions
├── views/             # EJS templates for pages and partials
│   └── partials/
├── index.js           # Main server entry point
├── package.json       # Project dependencies and scripts
└── .gitignore
```

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the repository

```bash
git clone https://github.com/rahulop5/Campus_Connect_FSD_Project.git
cd Campus_Connect_FSD_Project
```

### 2️⃣ Install dependencies

```bash
npm install
```

### 3️⃣ Create an `.env` file

Add the following configuration:

```
MONGO_URI=<your_mongodb_connection_string>
SESSION_SECRET=<your_secret_key>
PORT=3000
```

### 4️⃣ Run the application

```bash
npm start
```

or

```bash
node index.js
```

### 5️⃣ Visit in your browser

👉 **[http://localhost:3000](http://localhost:3000)**

---

## 📸 Main Pages

| Page                       | Description                      |
| -------------------------- | -------------------------------- |
| `home.ejs`                 | Landing page                     |
| `login.ejs` / `signup.ejs` | User authentication              |
| `dashboard.ejs`            | Student dashboard                |
| `profdashboard.ejs`        | Professor dashboard              |
| `admindashboard.ejs`       | Admin management panel           |
| `askquestion.ejs`          | Q&A posting interface            |
| `attendance.ejs`           | Attendance tracking page         |
| `bellgraph.ejs`            | Grade distribution visualization |

---

## 🧩 Folder Highlights

| Folder         | Purpose                                            |
| -------------- | -------------------------------------------------- |
| `config/`      | Contains DB, Multer, and Passport setup files      |
| `controllers/` | Handles all backend logic for different user roles |
| `models/`      | MongoDB schemas for each entity                    |
| `routes/`      | Express routers defining endpoints                 |
| `public/`      | Contains static assets (CSS, JS, images)           |
| `views/`       | All EJS templates for rendering UI                 |

---

## 🤝 Contribution

Contributions are always welcome!
Follow these steps:

1. Fork this repository
2. Create a new branch (`git checkout -b feature-name`)
3. Commit your changes (`git commit -m "Add feature"`)
4. Push your branch (`git push origin feature-name`)
5. Open a Pull Request 🎉

---

## 🧾 License

This project is licensed under the **MIT License**.
Feel free to use, modify, and distribute it with attribution.

---

## 👥 Team

Developed by a team of passionate students at **IIIT Sri City**.

| Name          | Email                                                       | GitHub                                                         |
| ------------- | ----------------------------------------------------------- | -------------------------------------------------------------- |
| **Rahul**     | [venkatrahul.v23@iiits.in](mailto:venkatrahul.v23@iiits.in) | [@rahulop5](https://github.com/rahulop5)                       |
| **Saitej**    | [saitej.r23@iiits.in](mailto:saitej.r23@iiits.in)           | [@Saitej2456](https://github.com/Saitej2456)                   |
| **Sahal**     | [sahalansar.t23@iiits.in](mailto:sahalansar.t23@iiits.in)   | [@Sahal-Ansar](https://github.com/Sahal-Ansar)                 |
| **Yashwanth** | [yashwanth.s23@iiits.in](mailto:yashwanth.s23@iiits.in)     | [@Yashwanth-Sarimalla](https://github.com/Yashwanth-Sarimalla) |

---

## 🏁 Summary

**Campus Connect** is more than a management system — it’s a **digital bridge** connecting all corners of campus life.
With its modern architecture and user-centric design, it transforms academic collaboration into a seamless, engaging, and data-driven experience.

---
