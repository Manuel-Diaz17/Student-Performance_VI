document.addEventListener("DOMContentLoaded", () => {
    const dataPath = "./data/student-merge.csv"; // Path to your dataset

    // Load the data using D3
    d3.dsv(";", dataPath).then(data => {
        console.log("Data loaded:", data);

        // Convert relevant fields to numbers
        data.forEach(d => {
            d.G3 = isNaN(+d.G3) ? 0 : +d.G3; // Final grade
            d.Walc = isNaN(+d.Walc) ? 0 : +d.Walc; // Weekend alcohol consumption
            d.Goout = isNaN(+d.goout) ? 0 : +d.goout; // Going out with friends
            d.famrel = isNaN(+d.famrel) ? 0 : +d.famrel; // Family relationship
            d.freetime = isNaN(+d.freetime) ? 0 : +d.freetime; // Free time
            d.health = isNaN(+d.health) ? 0 : +d.health; // Health status
        });

        // Function to filter data and update the radar chart
        function filterDataByGrade() {
            const filterValue = document.getElementById("grade-filter").value;
            let filteredData;

            // Apply the selected filter
            if (filterValue === "lessThan10") {
                filteredData = data.filter(d => d.G3 < 10);
            } else if (filterValue === "between10And15") {
                filteredData = data.filter(d => d.G3 >= 10 && d.G3 < 15);
            } else if (filterValue === "greaterThan14") {
                filteredData = data.filter(d => d.G3 >= 15);
            } else {
                filteredData = data; 
            }

            console.log("Filtered Data:", filteredData);

            if (filteredData.length === 0) {
                console.warn("No data matches the filter criteria.");
                d3.select("#radarChart").html("<p>No data available for the selected filter.</p>");
                return;
            }

            // Calculate averages for radar chart
            const radarData = [
                { axis: "Family Relationship (famrel)", value: d3.mean(filteredData, d => d.famrel) || 1 },
                { axis: "Free Time (freetime)", value: d3.mean(filteredData, d => d.freetime) || 0 },
                { axis: "Going Out with Friends (goout)", value: d3.mean(filteredData, d => d.Goout) || 0 },
                { axis: "Weekend Alcohol Consumption (Walc)", value: d3.mean(filteredData, d => d.Walc) || 0 },
                { axis: "Health (health)", value: d3.mean(filteredData, d => d.health) || 0 }
            ];

            console.log("Radar Data for Chart:", radarData);

            // Render the radar chart
            createRadarChart(radarData);
        }

        // Initialize the chart with all data
        filterDataByGrade();

        // Update the chart when the filter changes
        document.getElementById("grade-filter").addEventListener("change", filterDataByGrade);
    }).catch(error => {
        console.error("Error loading data:", error);
    });

    // Function to create the radar chart
    function createRadarChart(data) {
        const margin = { top: 40, right: 40, bottom: 40, left: 40 };
        const width = 500 - margin.left - margin.right;
        const height = 500 - margin.top - margin.bottom;
        const maxValue = 10; // Assuming all values are scaled between 0 and 10

        // Clear previous chart
        d3.select("#radarChart").html("");

        // Append the SVG container
        const svg = d3.select("#radarChart").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${width / 2 + margin.left}, ${height / 2 + margin.top})`);

        const angleSlice = Math.PI * 2 / data.length;

        const radiusScale = d3.scaleLinear()
            .domain([0, maxValue])
            .range([0, Math.min(width, height) / 2]);

        const radarLine = d3.lineRadial()
            .curve(d3.curveLinearClosed)
            .radius(d => radiusScale(d.value))
            .angle((d, i) => i * angleSlice);

        // Draw background circles
        const numCircles = 5;
        for (let i = 1; i <= numCircles; i++) {
            svg.append("circle")
                .attr("r", radiusScale(i * (maxValue / numCircles)))
                .style("fill", "none")
                .style("stroke", "#ccc")
                .style("stroke-width", "0.5px");
        }

        // Draw axes
        const axis = svg.selectAll(".axis")
            .data(data)
            .enter().append("g")
            .attr("class", "axis");

        axis.append("line")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", (d, i) => radiusScale(maxValue) * Math.cos(i * angleSlice - Math.PI / 2))
            .attr("y2", (d, i) => radiusScale(maxValue) * Math.sin(i * angleSlice - Math.PI / 2))
            .style("stroke", "#ccc")
            .style("stroke-width", "2px");

        axis.append("text")
            .attr("x", (d, i) => radiusScale(maxValue + 1) * Math.cos(i * angleSlice - Math.PI / 2))
            .attr("y", (d, i) => radiusScale(maxValue + 1) * Math.sin(i * angleSlice - Math.PI / 2))
            .style("font-size", "12px")
            .style("text-anchor", "middle")
            .text(d => d.axis);

        // Draw radar area
        svg.append("path")
            .datum(data)
            .attr("class", "area")
            .attr("d", radarLine)
            .style("fill", "rgba(0, 204, 255, 0.5)")
            .style("stroke", "#00ccff")
            .style("stroke-width", "2px");
            
        
        console.log("Radar path:", radarLine(data));


        // Draw radar points
        svg.selectAll(".circle")
            .data(data)
            .enter().append("circle")
            .attr("class", "circle")
            .attr("r", 4)
            .attr("cx", (d, i) => radiusScale(d.value) * Math.cos(i * angleSlice - Math.PI / 2))
            .attr("cy", (d, i) => radiusScale(d.value) * Math.sin(i * angleSlice - Math.PI / 2))
            .style("fill", "#00ccff")
            .style("stroke", "#fff")
            .style("stroke-width", "2px");
        
            console.log("Radar points drawn:", data);

    }
});
