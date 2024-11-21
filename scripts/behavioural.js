document.addEventListener("DOMContentLoaded", () => {
    const dataPath = "./data/student-merge.csv";

    // Load the data using D3
    d3.dsv(";", dataPath).then(data => {
        console.log("Data loaded:", data);

        // Convert the final grades, alcohol consumption, and 'Goout' levels to numbers
        data.forEach(d => {
            d.G3 = isNaN(+d.G3) ? 0 : +d.G3; // Convert final grade (G3)
            d.Walc = isNaN(+d.Walc) ? 0 : +d.Walc; // Convert alcohol consumption (Walc)
            d.Goout = isNaN(+d.goout) ? 0 : +d.goout; // Convert going out with friends (Goout)
        });

        // Calculate the data for the first box plot (alcohol consumption vs final grades)
        const boxPlotDataAlcohol = calculateBoxPlotData(data, "Walc", "G3");

        // Draw the first box plot (Alcohol Consumption vs Final Grade)
        drawBoxPlot("#boxplot", boxPlotDataAlcohol, "Alcohol Consumption", "Final Grade");

        // Calculate the data for the second box plot (going out with friends vs final grades)
        const boxPlotDataGoout = calculateBoxPlotData(data, "Goout", "G3");

        // Draw the second box plot (Going out with friends vs Final Grade)
        drawBoxPlot("#boxplot-friends", boxPlotDataGoout, "Going Out with Friends", "Final Grade");

    }).catch(error => {
        console.error("Error loading data:", error);
    });

    // Function to calculate the box plot data
    function calculateBoxPlotData(data, groupKey, valueKey) {
        const groupedData = d3.group(data, d => d[groupKey]);

        const boxPlotData = Array.from(groupedData, ([key, values]) => {
            const sortedValues = values.map(d => +d[valueKey]).sort(d3.ascending);
            const q1 = d3.quantile(sortedValues, 0.25);
            const median = d3.median(sortedValues);
            const q3 = d3.quantile(sortedValues, 0.75);
            const iqr = q3 - q1;
            const min = sortedValues[0];
            const max = sortedValues[sortedValues.length - 1];

            return { key, q1, median, q3, iqr, min, max };
        });

        return boxPlotData;
    }

    // Configuration for box plots
    const boxPlotConfig = {
        width: 500,
        height: 300,
        margin: { top: 20, right: 90, bottom: 40, left: 50 }
    };

    // Function to add legends to the box plot
    function addBoxPlotLegend(svg, x, y) {
        const legendData = [
            { key: "1", value: "Low" },
            { key: "2", value: "Medium" },
            { key: "3", value: "High" },
            { key: "4", value: "Very High" }
        ];

        const legend = svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${x},${y})`);

        legend.selectAll("text")
            .data(legendData)
            .enter()
            .append("text")
            .attr("x", 0)
            .attr("y", (d, i) => i * 20)
            .text(d => `${d.key} - ${d.value}`)
            .style("font-size", "12px")
            .attr("fill", "#333");
    }

    // Function to draw the box plot
    function drawBoxPlot(svgId, data, xLabel, yLabel) {
        const svg = d3.select(svgId)
            .append("svg")
            .attr("width", boxPlotConfig.width + boxPlotConfig.margin.left + boxPlotConfig.margin.right)
            .attr("height", boxPlotConfig.height + boxPlotConfig.margin.top + boxPlotConfig.margin.bottom)
            .append("g")
            .attr("transform", `translate(${boxPlotConfig.margin.left},${boxPlotConfig.margin.top})`);

        // Tooltip
        const tooltip = d3.select("#tooltip");

        // X and Y scales
        const x = d3.scaleBand()
            .domain(data.map(d => d.key).sort(d3.ascending))
            .range([0, boxPlotConfig.width])
            .padding(0.4);

        const y = d3.scaleLinear()
            .domain([0, 20]) // Grades range from 0 to 20
            .range([boxPlotConfig.height, 0]);

        // X Axis
        svg.append("g")
            .attr("transform", `translate(0,${boxPlotConfig.height})`)
            .call(d3.axisBottom(x));

        // Y Axis
        svg.append("g")
            .call(d3.axisLeft(y));

        // Axis Labels
        svg.append("text")
            .attr("x", boxPlotConfig.width / 2)
            .attr("y", boxPlotConfig.height + 30)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .text(xLabel);

        svg.append("text")
            .attr("x", -boxPlotConfig.height / 2)
            .attr("y", -35)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .attr("transform", "rotate(-90)")
            .text(yLabel);

        // Draw the box plot
        svg.selectAll("g.box")
            .data(data)
            .enter()
            .append("g")
            .attr("class", "box")
            .each(function (d) {
                const group = d3.select(this);

                group.append("rect")
                    .attr("x", x(d.key))
                    .attr("y", y(d.q3))
                    .attr("width", x.bandwidth())
                    .attr("height", y(d.q1) - y(d.q3))
                    .attr("fill", "#69b3a2");

                group.append("line")
                    .attr("x1", x(d.key))
                    .attr("x2", x(d.key) + x.bandwidth())
                    .attr("y1", y(d.median))
                    .attr("y2", y(d.median))
                    .attr("stroke", "black");

                group.append("line")
                    .attr("x1", x(d.key) + x.bandwidth() / 2)
                    .attr("x2", x(d.key) + x.bandwidth() / 2)
                    .attr("y1", y(d.min))
                    .attr("y2", y(d.max))
                    .attr("stroke", "black");
            })
            .on("mouseover", (event, d) => {
                tooltip.transition().duration(200).style("opacity", 1);
                tooltip.html(
                    `Min: <strong>${d.min}</strong><br>
                    Q1: <strong>${d.q1}</strong><br>
                    Median: <strong>${d.median}</strong><br>
                    Q3: <strong>${d.q3}</strong><br>
                    Max: <strong>${d.max}</strong>`
                )
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 28}px`);
            })
            .on("mousemove", event => {
                tooltip
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 28}px`);
            })
            .on("mouseout", () => {
                tooltip.transition().duration(200).style("opacity", 0);
            });

        // Add the legend
        addBoxPlotLegend(svg, boxPlotConfig.width + 10, 10);
    }
});
