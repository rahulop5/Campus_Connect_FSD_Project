document.addEventListener('DOMContentLoaded', () => {
  // Handle Add Course Form
  const courseForm = document.getElementById('add-course-form');
  const courseErrorMessage = document.getElementById('error-message');

  if (courseForm) {
    courseForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(courseForm);
      const data = Object.fromEntries(formData);

      try {
        const response = await fetch('/admin/dashboard', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });

        if (response.ok) {
          window.location.href = '/admin/dashboard';
        } else {
          const result = await response.json();
          courseErrorMessage.textContent = result.message || 'Failed to add course';
        }
      } catch (error) {
        console.error('Error adding course:', error);
        courseErrorMessage.textContent = 'An error occurred. Please try again.';
      }
    });
  }

  // Handle Student Form (Add/Remove Toggle)
  const studentForm = document.getElementById('student-form');
  const studentErrorMessage = document.getElementById('student-error-message');
  const toggleButton = document.getElementById('toggle-student-mode');
  const formTitle = document.getElementById('student-form-title');
  const formFields = document.getElementById('student-form-fields');
  const submitButton = document.getElementById('student-submit-btn');
  let isAddMode = true;

  // Toggle between Add and Remove modes
  toggleButton.addEventListener('click', () => {
    isAddMode = !isAddMode;

    if (isAddMode) {
      // Switch to Add Mode
      formTitle.textContent = 'Add New Student';
      toggleButton.textContent = 'Switch to Remove Student';
      studentForm.action = '/admin/dashboard';
      submitButton.textContent = 'Add Student';

      formFields.innerHTML = `
        <input type="hidden" name="action" value="add-student">
        <label for="student-name">Name:</label>
        <input type="text" id="student-name" name="name" placeholder="Enter student name" required>
        <br>
        <label for="student-email">Email:</label>
        <input type="email" id="student-email" name="email" placeholder="Enter student email" required>
        <br>
        <label for="student-rollnumber">Roll Number:</label>
        <input type="text" id="student-rollnumber" name="rollnumber" placeholder="Enter roll number" required>
        <br>
        <label for="student-phone">Phone:</label>
        <input type="text" id="student-phone" name="phone" placeholder="Enter 10-digit phone number" required>
        <br>
        <label for="student-section">Section:</label>
        <input type="text" id="student-section" name="section" placeholder="Enter section" required>
        <br>
      `;
    } else {
      // Switch to Remove Mode
      formTitle.textContent = 'Remove Student';
      toggleButton.textContent = 'Switch to Add Student';
      studentForm.action = '/admin/dashboard';
      submitButton.textContent = 'Remove Student';

      formFields.innerHTML = `
        <input type="hidden" name="action" value="remove-student">
        <label for="student-email">Email:</label>
        <input type="email" id="student-email" name="email" placeholder="Enter student email to remove" required>
        <br>
      `;
    }

    // Clear error message on mode switch
    studentErrorMessage.textContent = '';
  });

  // Handle Student Form Submission
  if (studentForm) {
    studentForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!isAddMode) {
        if (!confirm('Are you sure you want to remove this student?')) {
          return;
        }
      }

      const formData = new FormData(studentForm);
      const data = Object.fromEntries(formData);

      try {
        const response = await fetch('/admin/dashboard', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });

        if (response.ok) {
          window.location.href = '/admin/dashboard';
        } else {
          const result = await response.json();
          studentErrorMessage.textContent = result.message || `Failed to ${isAddMode ? 'add' : 'remove'} student`;
        }
      } catch (error) {
        console.error(`Error ${isAddMode ? 'adding' : 'removing'} student:`, error);
        studentErrorMessage.textContent = 'An error occurred. Please try again.';
      }
    });
  }
});