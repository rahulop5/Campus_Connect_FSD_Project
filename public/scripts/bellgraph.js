let chartInstance;

document.addEventListener("DOMContentLoaded", function () {
  const defaultSubjectElement = [...document.querySelectorAll(".subject")].find(
    (el) => el.querySelector("p").innerText.trim() === defaultSubject
  );

  if (defaultSubject && defaultSubjectElement) {
    const defaultCourseId = defaultSubjectElement.getAttribute("data-course-id");
    updateGraphForSubject(defaultCourseId, defaultSubject, defaultSubjectElement);
  } else {
    console.error("Default subject is not defined or has no data.");
  }
});

function updateGraphForSubject(courseId, subject, element) {
  console.log("Updating graph for:", subject);

  // Remove the ID from the previously selected subject (if any)
  const prevSelected = document.getElementById("selected_subject");
  if (prevSelected) {
    prevSelected.removeAttribute("id");
  }

  // Mark the current element as selected
  if (element) {
    element.id = "selected_subject";
  } else {
    console.error("Element not found for subject:", subject);
  }

  // Update the displayed subject name
  document.getElementById("currentSubject").innerText = subject;

  // Fetch updated graph data from the server
  fetch(`/bellgraph-data/${courseId}`)
    .then((response) => response.json())
    .then((data) => {
      if (data && data.x && data.y) {
        drawGraph(data.x, data.y);
      } else {
        console.error("No data found for subject:", subject);
      }
    })
    .catch((error) => {
      console.error("Error fetching bell graph data:", error);
    });
}

function drawGraph(xData, yData) {
  const ctx = document.getElementById("bellChart").getContext("2d");

  // Destroy the existing chart instance if it exists
  if (chartInstance) {
    chartInstance.destroy();
  }

  // Create a new chart instance
  chartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: xData,
      datasets: [
        {
          label: "Bell Curve",
          data: yData,
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 2,
          fill: false,
          tension: 0.3,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        x: {
          title: {
            display: true,
            text: "Grade",
          },
        },
        y: {
          title: {
            display: true,
            text: "Frequency",
          },
        },
      },
    },
  });
}