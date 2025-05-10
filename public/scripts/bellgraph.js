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
    console.log("hi ig?");
    // Fetch updated graph data from the server
    fetch(`/bellgraph?courseId=${courseId}`)
        .then((response) => response.json())
        .then((data) => {
            if (data && data.bellgraphData) {
                updateGraph(data.bellgraphData);
            } else {
                console.error("No data found for subject:", subject);
            }
        })
        .catch((error) => {
            console.error("Error fetching bell graph data:", error);
        });
}

// updateGraphForSubject("681b234ca3e106baceb08612", "aids", document.getElementById("temp"));

function updateGraph(inputData) {
    const width = 1100, height = 500;
    const margin = { top: 20, right: 20, bottom: 40, left: 50 };

    const svg = d3.select("#chart").html("").append("svg")
        .attr("width", width)
        .attr("height", height);

    const xScale = d3.scaleLinear().range([margin.left, width - margin.right]);
    const yScale = d3.scaleLinear().range([height - margin.bottom, margin.top]);

    const line = d3.line()
        .x((d, i) => xScale(i))
        .y(d => yScale(d))
        .curve(d3.curveCardinal);

    // Set scale domains
    xScale.domain([0, inputData.length - 1]);
    yScale.domain([d3.min(inputData) - 10, d3.max(inputData) + 10]);

    // Clear previous SVG content
    svg.selectAll("*").remove();

    // Draw the shaded area under the curve
    svg.append("path")
        .datum(inputData)
        .attr("fill", "lime")
        .attr("opacity", 0.3)
        .attr("d", d3.area()
            .x((d, i) => xScale(i))
            .y0(yScale(d3.min(inputData) - 10))
            .y1(d => yScale(d))
            .curve(d3.curveCardinal)
        );

    // Draw the main graph line
    svg.append("path")
        .datum(inputData)
        .attr("fill", "none")
        .attr("stroke", "lime")
        .attr("stroke-width", 3)
        .attr("d", line);
}