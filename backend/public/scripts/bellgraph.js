let chartInstance;

function initBellGraph() {
  const defaultSubject = document.querySelector("#bellgraph-data").dataset.defaultSubject;
  const defaultCourseId = document.querySelector("#bellgraph-data").dataset.defaultCourseId;

  const defaultSubjectElement = [...document.querySelectorAll(".subject")].find(
    (el) => el.querySelector("p").innerText.trim() === defaultSubject
  );

  if (defaultCourseId && defaultSubjectElement) {
    updateGraphForSubject(defaultCourseId, defaultSubject, defaultSubjectElement);
  } else {
    console.error("Default subject not defined or invalid.");
  }
}

function updateGraphForSubject(courseId, subject, element) {
  console.log("Updating graph for:", subject);

  // Remove previously selected highlight
  const prevSelected = document.getElementById("selected_subject");
  if (prevSelected) prevSelected.removeAttribute("id");

  // Mark this subject as selected
  if (element) element.id = "selected_subject";

  // Update subject title
  document.getElementById("currentSubject").innerText = subject;

  // Fetch the updated graph data
  fetch(`/bellgraph-data/${courseId}`)
    .then((res) => res.json())
    .then((data) => {
      if (data && data.x && data.y) {
        drawGraph(data.x, data.y);
      } else {
        console.error("No data for subject:", subject);
      }
    })
    .catch((err) => console.error("Error fetching graph data:", err));
}

function drawGraph(xData, yData) {
  const ctx = document.getElementById("bellChart").getContext("2d");

  if (chartInstance) chartInstance.destroy();

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
        x: { title: { display: true, text: "Grade" } },
        y: { title: { display: true, text: "Frequency" } },
      },
    },
  });
}
