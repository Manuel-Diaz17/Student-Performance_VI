document.addEventListener("DOMContentLoaded", () => {
    const dataPath = "./data/student-merge.csv";
    let originalData; // Variável para armazenar os dados originais

    //Função para calcular a regressão linear
    function calculateLinearRegression(data) {
        const n = data.length;
        const sumX = d3.sum(data, d => d.absences);
        const sumY = d3.sum(data, d => d.G3);
        const sumXY = d3.sum(data, d => d.absences * d.G3);
        const sumX2 = d3.sum(data, d => d.absences * d.absences);
    
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
    
        return { slope, intercept };
    }

    // Configurações do gráfico
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const width = 820 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    // Criar o tooltip
    const tooltip = d3.select("body")
        .append("div")
        .attr("id", "tooltip")
        .style("position", "absolute")
        .style("background", "#ffffff")
        .style("border", "1px solid #ccc")
        .style("padding", "10px")
        .style("border-radius", "5px")
        .style("box-shadow", "0 2px 5px rgba(0,0,0,0.1)")
        .style("opacity", 0);

    // Definir comportamento de zoom
    const zoom = d3.zoom()
        .scaleExtent([1, 10]) // Limites de zoom
        .translateExtent([[0, 0], [width, height]]) // Limitar o pan dentro dos limites do gráfico
        .on("zoom", (event) => {
            zoomGroup.attr("transform", event.transform); // Aplicar a transformação de zoom/pan
        });

    // Criar SVG para o scatter plot
    const svg = d3.select("#scatterplot")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .call(zoom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const zoomGroup = svg.append("g")
        .attr("class", "zoom-group");

    // Escalas
    const x = d3.scaleLinear().range([0, width]);
    const y = d3.scaleLinear().range([height, 0]);
    const color = d3.scaleSequential(d3.interpolateBlues);

    //Função para aplicar os filtros
    function filterData(data) {
        const selectedCourse = document.getElementById("course-filter").value;
        const selectedHigher = document.getElementById("higher-filter").value;
        const selectedInternet = document.getElementById("internet-filter").value;
        const selectedActivities = document.getElementById("activities-filter").value;
        const selectedPaid = document.getElementById("paid-filter").value;
    
        return data.filter(d => {
            return (
                (selectedCourse === "all" || d.course === selectedCourse) &&
                (selectedHigher === "all" || d.higher === selectedHigher) &&
                (selectedInternet === "all" || d.internet === selectedInternet) &&
                (selectedActivities === "all" || d.activities === selectedActivities) &&
                (selectedPaid === "all" || d.paid === selectedPaid)
            );
        });
    }

    //Função para desenhar o line chart
    function drawLineChart(student) {
        // Configurações do gráfico
        const margin = { top: 20, right: 30, bottom: 40, left: 50 };
        const width = 330 - margin.left - margin.right;
        const height = 355 - margin.top - margin.bottom;
    
        // Limpar qualquer gráfico anterior
        d3.select("#line-chart").html("");
    
        // Criar SVG para o gráfico de linha
        const svg = d3.select("#line-chart")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
    
        // Dados do aluno para o gráfico
        const grades = [
            { semester: "G1", grade: student.G1 },
            { semester: "G2", grade: student.G2 },
            { semester: "G3", grade: student.G3 },
        ];
    
        // Escalas
        const x = d3.scalePoint()
            .domain(grades.map(d => d.semester))
            .range([0, width]);
    
        const y = d3.scaleLinear()
            .domain([0, 20])
            .range([height, 0]);
    
        // Eixos
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x));
    
        svg.append("g")
            .call(d3.axisLeft(y));
    
        // Linha
        const line = d3.line()
            .x(d => x(d.semester))
            .y(d => y(d.grade));
    
        svg.append("path")
            .datum(grades)
            .attr("fill", "none")
            .attr("stroke", "blue")
            .attr("stroke-width", 2)
            .attr("d", line);
    
        // Pontos
        svg.selectAll("circle")
            .data(grades)
            .enter()
            .append("circle")
            .attr("cx", d => x(d.semester))
            .attr("cy", d => y(d.grade))
            .attr("r", 5)
            .attr("fill", "red")
            .on("mouseover", (event, d) => {
                tooltip.transition().duration(200).style("opacity", 1);
                tooltip.html(`
                    <strong>Semester:</strong> ${d.semester}<br>
                    <strong>Grade:</strong> ${d.grade}
                `)
                .style("left", (event.pageX + 15) + "px")
                .style("top", (event.pageY - 20) + "px");
            })
            .on("mousemove", event => {
                tooltip.style("left", (event.pageX + 15) + "px")
                       .style("top", (event.pageY - 20) + "px");
            })
            .on("mouseout", () => {
                tooltip.transition().duration(200).style("opacity", 0);
            });

        // Legenda para o eixo X
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height + margin.bottom - 5)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .text("Semesters");

        // Legenda para o eixo Y
        svg.append("text")
            .attr("x", -height / 2)
            .attr("y", -margin.left + 10)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .attr("transform", "rotate(-90)")
            .text("Grades");
    }

    function addClick(selection){
        selection
        .style("cursor", "pointer")
        .on("click", (event, d) => {
            // Exibir o container do gráfico de linha
            d3.select(".line-chart-container").style("display", "block");

            // Desenhar o gráfico de linha com os dados do aluno
            drawLineChart(d);
        });
    }

    //Função para atualizar os dados do scatter plot
    function updateScatterPlot(data) {
        // Recalcular os dados filtrados
        const filteredData = filterData(data);
    
        // Atualizar os pontos
        const circles = zoomGroup.selectAll("circle")
        .data(filteredData, d => `${d.absences}-${d.G3}`); // Usa um identificador único para cada ponto
    
        circles.join(
            enter => enter.append("circle")
                .attr("cx", d => x(d.absences) + (Math.random() - 0.5) * 8) // Jitter no eixo X
                .attr("cy", d => y(d.G3) + (Math.random() - 0.5) * 8) // Jitter no eixo Y
                .attr("r", 5)
                .attr("fill", d => color(d.studytime))
                .attr("opacity", 0.8)
                .on("mouseover", (event, d) => {
                    tooltip.transition().duration(200).style("opacity", 1);
                    tooltip.html(`
                        <strong>Absences:</strong> ${d.absences}<br>
                        <strong>Final Grade:</strong> ${d.G3}<br>
                        <strong>Study Time:</strong> ${d.studytime}
                    `)
                    .style("left", (event.pageX + 15) + "px")
                    .style("top", (event.pageY - 20) + "px");
                })
                .on("mousemove", event => {
                    tooltip.style("left", (event.pageX + 15) + "px")
                           .style("top", (event.pageY - 20) + "px");
                })
                .on("mouseout", () => {
                    tooltip.transition().duration(200).style("opacity", 0);
                }),
            update => update
                .transition().duration(500)
                .attr("cx", d => x(d.absences) + (Math.random() - 0.5) * 8)
                .attr("cy", d => y(d.G3) + (Math.random() - 0.5) * 8),
            exit => exit.transition().duration(500).attr("r", 0).remove()
        );

        // Adicionar evento de clique
        zoomGroup.selectAll("circle").call(addClick);

        // Remover a linha de regressão antiga antes de desenhar uma nova
        zoomGroup.selectAll(".regression-line").remove();

        // Recalcular e atualizar a linha de regressão
        const regression = calculateLinearRegression(filteredData);

        const regressionLine = zoomGroup.selectAll(".regression-line")
            .data([regression]);

        regressionLine.join(
            enter => enter.append("line")
                .attr("class", "regression-line")
                .attr("x1", x(0))
                .attr("y1", y(regression.intercept))
                .attr("x2", x(d3.max(filteredData, d => d.absences)))
                .attr("y2", y(regression.slope * d3.max(filteredData, d => d.absences) + regression.intercept))
                .attr("stroke", "red")
                .attr("stroke-width", 2)
                .attr("stroke-dasharray", "5,5"),
            update => update
                .transition().duration(500)
                .attr("x1", x(0))
                .attr("y1", y(regression.intercept))
                .attr("x2", x(d3.max(filteredData, d => d.absences)))
                .attr("y2", y(regression.slope * d3.max(filteredData, d => d.absences) + regression.intercept)),
            exit => exit.remove()
        );
    }

    // Função para resetar todos os filtros para 'all'
    function resetFilters() {
        // Resetar filtros
        d3.select("#course-filter").property("value", "all");
        d3.select("#higher-filter").property("value", "all");
        d3.select("#internet-filter").property("value", "all");
        d3.select("#activities-filter").property("value", "all");
        d3.select("#paid-filter").property("value", "all");

        // Atualizar gráfico com todos os dados
        updateScatterPlot(originalData); // originalData é o dataset completo
    }

    d3.select(".line-chart-container").style("display", "none");

    // Função de reset do zoom
    document.getElementById("reset-zoom").addEventListener("click", () => {
        svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity); // Redefinir para o zoom original
    });

    //Adicionar eventos aos filtros
    ["course-filter", "higher-filter", "internet-filter", "activities-filter", "paid-filter"].forEach(filterId => {
        document.getElementById(filterId).addEventListener("change", () => {
            updateScatterPlot(originalData);
        });
    });

    // Adicionar evento ao botão de reset
    document.getElementById("reset-filters").addEventListener("click", resetFilters);
    
    //Adicionar evento ao botão de fechar o line chart
    document.getElementById("close-line-chart").addEventListener("click", () => {
        d3.select(".line-chart-container").style("display", "none");
        d3.select("#line-chart").html(""); // Limpar o gráfico
    });

    // Carregar os dados e desenhar o gráfico inicial
    d3.dsv(";", dataPath).then(data => {
        data.forEach(d => {
            d.absences = +d.absences;
            d.G3 = +d.G3;
            d.studytime = +d.studytime;
        });

        originalData = data;

        // Configurar escalas com base nos dados
        x.domain([0, d3.max(data, d => d.absences)]).nice();
        y.domain([0, 20]).nice(); // Notas de 0 a 20
        color.domain([1, 4]); // Tempo de estudo de 1 a 4

        // Adicionar eixos
        zoomGroup.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x));

        zoomGroup.append("g")
            .attr("class", "y-axis")
            .call(d3.axisLeft(y));

        // Adicionar pontos com jittering
        zoomGroup.selectAll("circle")
            .data(data)
            .enter()
            .append("circle")
            .attr("cx", d => x(d.absences) + (Math.random() - 0.5) * 8) // Jitter no eixo X
            .attr("cy", d => y(d.G3) + (Math.random() - 0.5) * 8) // Jitter no eixo Y
            .attr("r", 5)
            .attr("fill", d => color(d.studytime))
            .attr("opacity", 0.6);

        

        // Adicionar linha de regressão ao scatter plot
        const regression = calculateLinearRegression(data);

        zoomGroup.append("line")
            .attr("class", "regression-line")
            .attr("x1", x(0))
            .attr("y1", y(regression.intercept))
            .attr("x2", x(d3.max(data, d => d.absences)))
            .attr("y2", y(regression.slope * d3.max(data, d => d.absences) + regression.intercept))
            .attr("stroke", "red")
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "5,5"); // Linha tracejada

        // Criar a legenda para o tempo de estudo
        const legend = svg.append("g")
        .attr("transform", `translate(${width - 80}, 20)`);

        const studytimeDescriptions = [
            { key: 1, label: "1 - < 2 hours" },
            { key: 2, label: "2 - 2 to 5 hours" },
            { key: 3, label: "3 - 5 to 10 hours" },
            { key: 4, label: "4 - > 10 hours" }
        ];
        
        legend.selectAll("rect")
            .data(studytimeDescriptions)
            .enter()
            .append("rect")
            .attr("x", 0)
            .attr("y", (d, i) => i * 20)
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", d => color(d.key));
        
        legend.selectAll("text")
            .data(studytimeDescriptions)
            .enter()
            .append("text")
            .attr("x", 20)
            .attr("y", (d, i) => i * 20 + 12)
            .text(d => ` ${d.label}`)
            .style("font-size", "12px")
            .attr("alignment-baseline", "middle");

        // Rótulo para o eixo X
        zoomGroup.append("text")
            .attr("x", width / 2)
            .attr("y", height + margin.bottom - 5)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .text("Number of Absences");

        // Rótulo para o eixo Y
        zoomGroup.append("text")
            .attr("x", -height / 2)
            .attr("y", -margin.left + 10)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .attr("transform", "rotate(-90)")
            .text("Final Grade");

        svg.selectAll("circle")
            .on("mouseover", (event, d) => {
                tooltip.transition().duration(200).style("opacity", 1);
                tooltip.html(`
                    <strong>Absences:</strong> ${d.absences}<br>
                    <strong>Final Grade:</strong> ${d.G3}<br>
                    <strong>Study Time:</strong> ${d.studytime}
                `)
                .style("left", (event.pageX + 15) + "px")
                .style("top", (event.pageY - 20) + "px");
            })
            .on("mousemove", event => {
                tooltip.style("left", (event.pageX + 15) + "px")
                       .style("top", (event.pageY - 20) + "px");
            })
            .on("mouseout", () => {
                tooltip.transition().duration(200).style("opacity", 0);
            });

        // Adicionar evento de clique
        zoomGroup.selectAll("circle").call(addClick);
    });
    
});
