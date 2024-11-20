// script.js
document.addEventListener("DOMContentLoaded", () => {
    // Caminho para o dataset
    const dataPath = "./data/student-merge.csv";

    // Carregar os dados usando D3
    d3.csv(dataPath).then(data => {
        console.log("Dados carregados:", data);

        // Exemplo de campos disponíveis (ajuste conforme necessário)
        console.log("Campos disponíveis:", Object.keys(data[0]));
    }).catch(error => {
        console.error("Erro ao carregar os dados:", error);
    });

    d3.dsv(";", "./data/student-merge.csv").then(data => {
        // Converter as notas finais para números
        data.forEach(d => {
            d.G3 = isNaN(+d.G3) ? 0 : +d.G3;
        });
    
        // Contar a frequência de cada nota final
        const gradeCounts = d3.range(0, 21).map(grade => ({
            grade: grade,
            count: data.filter(d => d.G3 === grade).length
        }));
    
        console.log("Frequências das notas:", gradeCounts);
    
        // Configuração do gráfico
        const margin = { top: 30, right: 30, bottom: 50, left: 50 };
        const width = 800 - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;
    
        const svg = d3.select("#bar-chart")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
    
        // Tooltip
        const tooltip = d3.select("#tooltip");

        // Escalas
        const x = d3.scaleBand()
            .domain(gradeCounts.map(d => d.grade)) // Cada nota no eixo X
            .range([0, width])
            .padding(0.2); // Espaçamento entre as barras
    
        const y = d3.scaleLinear()
            .domain([0, d3.max(gradeCounts, d => d.count)]) // Máximo de alunos numa nota
            .nice()
            .range([height, 0]);
    
        // Eixo X
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x));
    
        // Eixo Y
        svg.append("g")
            .call(d3.axisLeft(y));

        // Adicionar legendas ao gráfico de barras
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height + 40)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .text("Final Grade");

        svg.append("text")
            .attr("x", -height / 2)
            .attr("y", -35)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .attr("transform", "rotate(-90)")
            .text("Number of Students");
    
        // Desenhar as barras
        svg.selectAll("rect")
            .data(gradeCounts)
            .enter()
            .append("rect")
            .attr("x", d => x(d.grade))
            .attr("y", d => y(d.count))
            .attr("width", x.bandwidth()) // Largura de cada barra
            .attr("height", d => height - y(d.count)) // Altura da barra
            .attr("fill", "#69b3a2")
            // Eventos para o tooltip
            .on("mouseover", (event, d) => {
                tooltip.transition().duration(200).style("opacity", 1);
                tooltip.html(`Grade: <strong>${d.grade}</strong><br>Students: <strong>${d.count}</strong>`)
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 28}px`);
            })
            .on("mousemove", event => {
                tooltip.style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 28}px`);
            })
            .on("mouseout", () => {
                tooltip.transition().duration(200).style("opacity", 0);
            });
            
    }).catch(error => {
        console.error("Erro ao carregar os dados:", error);
    });
        
    // Função para calcular os dados de um box plot
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

    // Configuração para os box plots
    const boxPlotConfig = {
        width: 300,
        height: 170,
        margin: { top: 20, right: 140, bottom: 45, left: 50 }
    };

    function addBoxPlotLegend(svg, x, y) {
        const legendData = [
            { key: "0", value: "None" },
            { key: "1", value: "Primary Education" },
            { key: "2", value: "5th to 9th Grade" },
            { key: "3", value: "Secondary Education" },
            { key: "4", value: "Higher Education" }
        ];
    
        const legend = svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${x},${y})`);
    
        // Adicionar os itens da legenda
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
    

    // Desenhar um box plot
    function drawBoxPlot(svgId, data, xLabel, yLabel) {
        const svg = d3.select(svgId)
            .append("svg")
            .attr("width", boxPlotConfig.width + boxPlotConfig.margin.left + boxPlotConfig.margin.right)
            .attr("height", boxPlotConfig.height + boxPlotConfig.margin.top + boxPlotConfig.margin.bottom)
            .append("g")
            .attr("transform", `translate(${boxPlotConfig.margin.left},${boxPlotConfig.margin.top})`);

        // Tooltip
        const tooltip = d3.select("#tooltip");

        // Escalas
        const x = d3.scaleBand()
            .domain(data.map(d => d.key).sort(d3.ascending))
            .range([0, boxPlotConfig.width])
            .padding(0.4);

        const y = d3.scaleLinear()
            .domain([0, 20]) // Notas de 0 a 20
            .range([boxPlotConfig.height, 0]);

        // Eixo X
        svg.append("g")
            .attr("transform", `translate(0,${boxPlotConfig.height})`)
            .call(d3.axisBottom(x));

        // Eixo Y
        svg.append("g")
            .call(d3.axisLeft(y));

        // Legendas dos eixos
        svg.append("text")
            .attr("x", boxPlotConfig.width / 2)
            .attr("y", boxPlotConfig.height + 40)
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

        // Desenhar os box plots
        svg.selectAll("g.box")
            .data(data)
            .enter()
            .append("g")
            .attr("class", "box")
            .each(function (d) {
                const group = d3.select(this);

                // Retângulo (entre Q1 e Q3)
                group.append("rect")
                    .attr("x", x(d.key))
                    .attr("y", y(d.q3))
                    .attr("width", x.bandwidth())
                    .attr("height", y(d.q1) - y(d.q3))
                    .attr("fill", "#69b3a2");

                // Linha mediana
                group.append("line")
                    .attr("x1", x(d.key))
                    .attr("x2", x(d.key) + x.bandwidth())
                    .attr("y1", y(d.median))
                    .attr("y2", y(d.median))
                    .attr("stroke", "black");

                // Min e Max
                group.append("line")
                    .attr("x1", x(d.key) + x.bandwidth() / 2)
                    .attr("x2", x(d.key) + x.bandwidth() / 2)
                    .attr("y1", y(d.min))
                    .attr("y2", y(d.max))
                    .attr("stroke", "black");
            })
            // Adicionar eventos para o tooltip
            .on("mouseover", (event, d) => {
                tooltip.transition().duration(200).style("opacity", 1);
                tooltip.html(
                    `Min: <strong>${d.min}</strong><br>
                    Q1: <strong>${d.q1}</strong><br>
                    Mediana: <strong>${d.median}</strong><br>
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

        // Adicionar a legenda
        addBoxPlotLegend(svg, boxPlotConfig.width + 10, 10);

    }

    // Carregar e processar os dados
    d3.dsv(";", "./data/student-merge.csv").then(data => {
        data.forEach(d => {
            d.G3 = +d.G3;
            d.Medu = +d.Medu;
            d.Fedu = +d.Fedu;
        });

        // Calcular dados para os box plots
        const motherBoxPlotData = calculateBoxPlotData(data, "Medu", "G3");
        const fatherBoxPlotData = calculateBoxPlotData(data, "Fedu", "G3");

        // Desenhar os box plots
        drawBoxPlot("#boxplot-mother", motherBoxPlotData, "Mother's Qualification", "Final Grade");
        drawBoxPlot("#boxplot-father", fatherBoxPlotData, "Father's Qualification", "Final Grade");
    });


});
