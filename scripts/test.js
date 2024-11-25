document.addEventListener("DOMContentLoaded", () => {
    const dataPath = "./data/student-merge.csv";

    // Load and process data
    d3.dsv(";", dataPath).then(data => {
        console.log("Data loaded:", data);

        // Clean and format data
        data.forEach(d => {
            d.G3 = isNaN(+d.G3) ? 0 : +d.G3;
            d.Walc = isNaN(+d.Walc) ? 0 : +d.Walc;
            d.Goout = isNaN(+d.goout) ? 0 : +d.goout;
            d.famrel = isNaN(+d.famrel) ? 0 : +d.famrel;
            d.freetime = isNaN(+d.freetime) ? 0 : +d.freetime;
            d.health = isNaN(+d.health) ? 0 : +d.health;
        });

        // Draw Box Plots
        drawBoxPlots(data);

        // Initialize Radar Chart
        filterAndDrawRadar(data);

        // Update Radar Chart on Filter Change
        document.getElementById("grade-filter").addEventListener("change", () => filterAndDrawRadar(data));

    }).catch(error => {
        console.error("Error loading data:", error);
    });

    function drawBoxPlots(data) {
        const boxPlotDataAlcohol = calculateBoxPlotData(data, "Walc", "G3");
        drawBoxPlot("#boxplot", boxPlotDataAlcohol, "Alcohol Consumption", "Final Grade");

        const boxPlotDataGoout = calculateBoxPlotData(data, "Goout", "G3");
        drawBoxPlot("#boxplot-friends", boxPlotDataGoout, "Going Out with Friends", "Final Grade");
    }

    function filterAndDrawRadar(data) {
        const filterValue = document.getElementById("grade-filter").value;
        let filteredData = data;

        if (filterValue === "lessThan10") {
            filteredData = data.filter(d => d.G3 < 10);
        } else if (filterValue === "between10And15") {
            filteredData = data.filter(d => d.G3 >= 10 && d.G3 < 15);
        } else if (filterValue === "greaterThan14") {
            filteredData = data.filter(d => d.G3 >= 15);
        }

        const radarData = [
            { axis: "Family Relationship (famrel)", value: d3.mean(filteredData, d => d.famrel) || 1 },
            { axis: "Free Time (freetime)", value: d3.mean(filteredData, d => d.freetime) || 0 },
            { axis: "Going Out with Friends (goout)", value: d3.mean(filteredData, d => d.Goout) || 0 },
            { axis: "Weekend Alcohol Consumption (Walc)", value: d3.mean(filteredData, d => d.Walc) || 0 },
            { axis: "Health (health)", value: d3.mean(filteredData, d => d.health) || 0 }
        ];

        createRadarChart(radarData);
    }

    function calculateBoxPlotData(data, groupKey, valueKey) {
        const groupedData = d3.group(data, d => d[groupKey]);
        return Array.from(groupedData, ([key, values]) => {
            const sortedValues = values.map(d => +d[valueKey]).sort(d3.ascending);
            const q1 = d3.quantile(sortedValues, 0.25);
            const median = d3.median(sortedValues);
            const q3 = d3.quantile(sortedValues, 0.75);
            const iqr = q3 - q1;
            return { key, q1, median, q3, iqr, min: sortedValues[0], max: sortedValues[sortedValues.length - 1] };
        });
    }

    function drawBoxPlot(svgId, data, xLabel, yLabel) {
        const boxPlotConfig = {
            width: 270,
            height: 150,
            margin: { top: 20, right: 90, bottom: 40, left: 50 }
        };
    
        const svg = d3.select(svgId)
            .append("svg")
            .attr("width", boxPlotConfig.width + boxPlotConfig.margin.left + boxPlotConfig.margin.right)
            .attr("height", boxPlotConfig.height + boxPlotConfig.margin.top + boxPlotConfig.margin.bottom)
            .append("g")
            .attr("transform", `translate(${boxPlotConfig.margin.left},${boxPlotConfig.margin.top})`);
    
        const tooltip = d3.select("#tooltip");
    
        // X and Y scales
        const x = d3.scaleBand()
            .domain(data.map(d => d.key).sort(d3.ascending))
            .range([0, boxPlotConfig.width])
            .padding(0.4);
    
        const y = d3.scaleLinear()
            .domain([0, 20]) // Adjust range based on grades or values
            .range([boxPlotConfig.height, 0]);
    
        // Draw Axes
        svg.append("g")
            .attr("transform", `translate(0,${boxPlotConfig.height})`)
            .call(d3.axisBottom(x));
    
        svg.append("g")
            .call(d3.axisLeft(y));
    
        // Add Labels
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
    
        // Draw Box Plots
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
    }
    
    function createRadarChart(data) {
        const margin = { top: 60, right: 40, bottom: 40, left: 40 };
        // const width = 500 - margin.left - margin.right;
        const width = 800 - 30 - 50;
        const height = 400 - 30 - 50;
        // const height = 500 - margin.top - margin.bottom;
        const maxValue = 5;
    
        d3.select("#radarChart").html(""); 
    
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
    
        for (let i = 1; i <= 5; i++) {
            svg.append("circle")
                .attr("r", radiusScale(i * (maxValue / 5)))
                .style("fill", "none")
                .style("stroke", "#ccc")
                .style("stroke-width", "0.5px");
        }
    
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
    
        svg.append("path")
            .datum(data)
            .attr("class", "area")
            .attr("d", radarLine)
            .style("fill", "rgba(105, 179, 162, 0.5)")
            .style("stroke", "#69b3a280")
            .style("stroke-width", "2px");
    
        svg.selectAll(".circle")
            .data(data)
            .enter().append("circle")
            .attr("class", "circle")
            .attr("r", 4)
            .attr("cx", (d, i) => radiusScale(d.value) * Math.cos(i * angleSlice - Math.PI / 2))
            .attr("cy", (d, i) => radiusScale(d.value) * Math.sin(i * angleSlice - Math.PI / 2))
            .style("fill", "#69b3a2d9")
            .style("stroke", "#fff")
            .style("stroke-width", "2px");
    }
});
