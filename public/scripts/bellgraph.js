const width = 1100, height = 500;
        const margin = { top: 20, right: 20, bottom: 40, left: 50 };

        const svg = d3.select("#chart")
            .append("svg")
            .attr("width", width)
            .attr("height", height);

        let xScale = d3.scaleLinear().range([margin.left, width - margin.right]);
        let yScale = d3.scaleLinear().range([height - margin.bottom, margin.top]);

        const line = d3.line()
            .x((d, i) => xScale(i))
            .y(d => yScale(d))
            .curve(d3.curveCardinal);

        // Define SVG Filter for Glow
        const defs = svg.append("defs");

        const filter = defs.append("filter")
            .attr("id", "glow")
            .append("feGaussianBlur")
            .attr("stdDeviation", "10")
            .attr("result", "coloredBlur");

        const gradient = defs.append("linearGradient")
            .attr("id", "glow-gradient")
            .attr("x1", "0%").attr("y1", "0%")
            .attr("x2", "0%").attr("y2", "100%");

        gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "lime")
            .attr("stop-opacity", 0.5);

        gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "black")
            .attr("stop-opacity", 0);



        function updateGraph() {
            let inputData = "10,20,30,40,40,30,20,10";
            // let inputData = document.getElementById("dataInput").value;
            let data = inputData.split(",").map(d => parseFloat(d.trim()));

            if (data.some(isNaN)) {
                alert("Please enter valid numbers separated by commas.");
                return;
            }

            xScale.domain([0, data.length - 1]);
            yScale.domain([d3.min(data) - 10, d3.max(data) + 10]);

            svg.selectAll("*").remove();

            // Append shadow area
            svg.append("path")
                .datum(data)
                .attr("fill", "lime")
                .attr("opacity", 0.3)
                .attr("filter", "url(#glow)")  // Apply glow filter
                .attr("d", d3.area()
                    .x((d, i) => xScale(i))
                    .y0(yScale(d3.min(data) - 10))
                    .y1(d => yScale(d))
                    .curve(d3.curveCardinal)
                );

            // Append main glowing area
            svg.append("path")
                .datum(data)
                .attr("fill", "url(#glow-gradient)")
                .attr("d", d3.area()
                    .x((d, i) => xScale(i))
                    .y0(yScale(d3.min(data) - 10))
                    .y1(d => yScale(d))
                    .curve(d3.curveCardinal)
                );

            // Append line
            svg.append("path")
                .datum(data)
                .attr("fill", "none")
                .attr("stroke", "lime")
                .attr("stroke-width", 3)
                .attr("d", line);

            const tooltip = d3.select("#tooltip");

            // Append interactive circles
            svg.selectAll("circle")
                .data(data)
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

            const xAxis = d3.axisBottom(xScale).ticks(data.length);
            const yAxis = d3.axisLeft(yScale);

            svg.append("g")
                .attr("transform", `translate(0,${height - margin.bottom})`)
                .call(xAxis)
                .selectAll("text")
                .attr("fill", "white");

            svg.append("g")
                .attr("transform", `translate(${margin.left},0)`)
                .call(yAxis)
                .selectAll("text")
                .attr("fill", "white");

            svg.selectAll(".domain, .tick line")
                .attr("stroke", "white");
        }

updateGraph();
