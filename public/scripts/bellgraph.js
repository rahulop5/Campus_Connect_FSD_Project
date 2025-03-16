document.addEventListener("DOMContentLoaded", function () {
    // Automatically select and update the default subject graph
    const defaultElement = [...document.querySelectorAll(".subject p")]
        .find(p => p.innerText.trim() === defaultSubject)?.parentElement;
    
    if (defaultSubject && bellgraphData[defaultSubject]) {
        updateGraphForSubject(defaultSubject, defaultElement);
    } else {
        console.error("Default subject is not defined or has no data.");
    }
});

function updateGraphForSubject(subject, element) {
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

    // Update the graph with the new subject's data
    const data = bellgraphData[subject];
    if (data) {
        updateGraph(data);
    } else {
        console.error("No data found for subject:", subject);
    }
}

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
        .attr("filter", "url(#glow)")
        .attr("d", d3.area()
            .x((d, i) => xScale(i))
            .y0(yScale(d3.min(inputData) - 10))
            .y1(d => yScale(d))
            .curve(d3.curveCardinal)
        );

    // Gradient overlay for visual effect
    svg.append("path")
        .datum(inputData)
        .attr("fill", "url(#glow-gradient)")
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

    // Tooltip element
    const tooltip = d3.select("#tooltip");

    // Draw data points and handle hover interaction
    svg.selectAll("circle")
        .data(inputData)
        .enter()
        .append("circle")
        .attr("cx", (d, i) => xScale(i))
        .attr("cy", d => yScale(d))
        .attr("r", 5)
        .attr("fill", "lime")
        .attr("opacity", 0)
        .on("mouseover", function (event, d) {
            d3.select(this).transition().duration(100).attr("opacity", 1);
            tooltip.style("display", "block")
                .style("left", event.pageX + "px")
                .style("top", event.pageY - 30 + "px")
                .html(`Value: ${d}`);
        })
        .on("mouseout", function () {
            d3.select(this).transition().duration(200).attr("opacity", 0);
            tooltip.style("display", "none");
        });

    // Draw X-axis
    const xAxis = d3.axisBottom(xScale).ticks(inputData.length);
    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(xAxis)
        .selectAll("text")
        .attr("fill", "white");

    // Draw Y-axis
    const yAxis = d3.axisLeft(yScale);
    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(yAxis)
        .selectAll("text")
        .attr("fill", "white");

    // Style axis lines and ticks
    svg.selectAll(".domain, .tick line")
        .attr("stroke", "white");
}
