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

    let originalData;

    // Função para filtrar os dados com base nos filtros selecionados
    function filterData(data) {
        const selectedSex = document.getElementById("sex-filter").value;
        const selectedAge = document.getElementById("age-filter").value;
        const isAllAgesChecked = document.getElementById("all-ages").checked; // Verifica o estado do checkbox
        const selectedAddress = document.getElementById("address-filter").value;
        const selectedPstatus = document.getElementById("pstatus-filter").value;

        return data.filter(d => {
            return (
                (selectedSex === "all" || d.sex === selectedSex) &&
                (isAllAgesChecked || +d.age === +selectedAge) &&
                (selectedAddress === "all" || d.address === selectedAddress) &&
                (selectedPstatus === "all" || d.Pstatus === selectedPstatus)
            );
        });
    }

    // Função para resetar todos os filtros para 'all'
    function resetFilters() {
        // Resetar idade
        d3.select("#age-value").text("All");
        d3.select("#all-ages").property("checked", true);

        // Resetar outros filtros
        d3.select("#sex-filter").property("value", "all");
        d3.select("#address-filter").property("value", "all");
        d3.select("#pstatus-filter").property("value", "all");

        d3.select("#all-ages").property("checked", true);

        // Atualizar gráficos com todos os dados
        updateAllCharts(originalData); // originalData é o dataset completo
    }

    // Adicionar evento ao botão de reset
    document.getElementById("reset-filters").addEventListener("click", resetFilters);

    d3.select("#all-ages").property("checked", true);
    document.getElementById("age-filter").disabled = true; // Desabilita o slider

    // Função para atualizar todos os gráficos
    function updateAllCharts(data) {
        const filteredData = filterData(data);

        // Atualizar gráfico de barras
        updateBarChart(filteredData);

        const filteredMotherBoxPlotData = calculateBoxPlotData(filteredData, "Medu", "G3");
        const filteredFatherBoxPlotData = calculateBoxPlotData(filteredData, "Fedu", "G3");

        // Atualizar box plots
        updateBoxPlot("#boxplot-mother", filteredMotherBoxPlotData, "Medu", "Mother's Qualification", "Final Grade");
        updateBoxPlot("#boxplot-father", filteredFatherBoxPlotData, "Fedu", "Father's Qualification", "Final Grade");
    }

    // Adicionar eventos aos filtros
    ["sex-filter", "address-filter", "pstatus-filter"].forEach(filterId => {
        document.getElementById(filterId).addEventListener("change", () => {
            updateAllCharts(originalData);
        });
    });

    // Atualizar o valor do slider e aplicar o filtro
    document.getElementById("age-filter").addEventListener("input", (event) => {
        const selectedAge = event.target.value;

        // Atualizar o texto do rótulo
        document.getElementById("age-value").textContent = selectedAge;

        // Se o checkbox "Todas as idades" estiver desmarcado, atualize os gráficos
        if (!document.getElementById("all-ages").checked) {
            updateAllCharts(originalData);
        }
    });

    // Atualizar gráficos quando o checkbox "Todas as idades" for alterado
    document.getElementById("all-ages").addEventListener("change", (event) => {
        const isChecked = event.target.checked;

        if (isChecked) {
            // Mostrar todas as idades
            document.getElementById("age-filter").disabled = true; // Desabilita o slider
            document.getElementById("age-value").textContent = "All";
            updateAllCharts(originalData);
        } else {
            // Retornar ao valor do slider
            document.getElementById("age-filter").disabled = false; // Habilita o slider
            const selectedAge = document.getElementById("age-filter").value;
            document.getElementById("age-value").textContent = selectedAge;
            updateAllCharts(originalData);
        }
    });

    // Função para atualizar o gráfico de barras
    function updateBarChart(data) {
        // Contar a frequência de cada nota final
        const gradeCounts = d3.range(0, 21).map(grade => ({
            grade: grade,
            count: data.filter(d => d.G3 === grade).length
        }));
    
        // Selecionar o contêiner SVG criado no drawBarChart
        const svg = d3.select("#bar-chart svg g");
    
        // Configuração do gráfico
        const width = 800 - 30 - 50; // Mantém as margens do drawBarChart
        const height = 400 - 30 - 50;
    
        // Recalcular as escalas
        const x = d3.scaleBand()
            .domain(gradeCounts.map(d => d.grade)) // Notas de 0 a 20
            .range([0, width])
            .padding(0.2);
    
        const y = d3.scaleLinear()
            .domain([0, d3.max(gradeCounts, d => d.count)]).nice()
            .range([height, 0]);
    
        // Atualizar eixo X
        svg.select(".x-axis").remove(); // Remove eixo existente
        svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x));
    
        // Atualizar eixo Y
        svg.select(".y-axis").remove(); // Remove eixo existente
        svg.append("g")
            .attr("class", "y-axis")
            .call(d3.axisLeft(y));
    
        // Atualizar barras
        svg.selectAll("rect")
            .data(gradeCounts)
            .join(
                enter => enter.append("rect")
                    .attr("x", d => x(d.grade))
                    .attr("width", x.bandwidth())
                    .attr("y", y(0)) // Começa do zero para transição
                    .attr("height", 0)
                    .attr("fill", "#69b3a2"),
                update => update,
                exit => exit.remove()
            )
            .transition().duration(500) // Transição suave
            .attr("x", d => x(d.grade))
            .attr("y", d => y(d.count))
            .attr("height", d => height - y(d.count)); // Altura correta
    }
    
    

    function drawBarChart(data) {    
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
            .attr("class", "x-axis") // Classe para referência futura
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x));
    
        // Eixo Y
        svg.append("g")
            .attr("class", "y-axis") // Classe para referência futura
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
            
    }
       
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
        width: 270,
        height: 150,
        margin: { top: 5, right: 140, bottom: 45, left: 50 }
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

    // Função para atualizar os box plots
    function updateBoxPlot(containerId, data, groupKey, xLabel, yLabel) {
        const { width, height } = boxPlotConfig;
    
        const svg = d3.select(containerId).select("svg g");
    
        // Escalas
        const x = d3.scaleBand()
            .domain(data.map(d => d.key).sort(d3.ascending))
            .range([0, width])
            .padding(0.4);
    
        const y = d3.scaleLinear()
            .domain([0, 20]) // Notas de 0 a 20
            .range([height, 0]);
    
        // Atualizar eixos
        svg.select(".x-axis")
            .transition().duration(500)
            .call(d3.axisBottom(x));

        svg.select(".y-axis")
            .transition().duration(500)
            .call(d3.axisLeft(y));

        // Atualizar os box plots
        const boxGroups = svg.selectAll("g.box")
            .data(data);
    
        // Entrar e atualizar
        boxGroups.join(
            enter => {
                const group = enter.append("g").attr("class", "box");
    
                group.append("rect")
                    .attr("x", d => x(d.key))
                    .attr("width", x.bandwidth())
                    .attr("y", y(0))
                    .attr("height", 0)
                    .attr("fill", "#69b3a2")
                    .transition().duration(500)
                    .attr("y", d => y(d.q3))
                    .attr("height", d => y(d.q1) - y(d.q3));
    
                group.append("line")
                    .attr("class", "median-line")
                    .attr("x1", d => x(d.key))
                    .attr("x2", d => x(d.key) + x.bandwidth())
                    .attr("y1", y(0))
                    .attr("y2", y(0))
                    .transition().duration(500)
                    .attr("y1", d => y(d.median))
                    .attr("y2", d => y(d.median));
    
                group.append("line")
                    .attr("class", "min-max-line")
                    .attr("x1", d => x(d.key) + x.bandwidth() / 2)
                    .attr("x2", d => x(d.key) + x.bandwidth() / 2)
                    .attr("y1", y(0))
                    .attr("y2", y(0))
                    .transition().duration(500)
                    .attr("y1", d => y(d.min))
                    .attr("y2", d => y(d.max));
            },
            update => {
                update.select("rect")
                    .transition().duration(500)
                    .attr("x", d => x(d.key))
                    .attr("y", d => y(d.q3))
                    .attr("width", x.bandwidth())
                    .attr("height", d => y(d.q1) - y(d.q3));

                update.select(".median-line")
                    .transition().duration(500)
                    .attr("x1", d => x(d.key))
                    .attr("x2", d => x(d.key) + x.bandwidth())
                    .attr("y1", d => y(d.median))
                    .attr("y2", d => y(d.median));
    
                update.select(".min-max-line")
                    .transition().duration(500)
                    .attr("x1", d => x(d.key) + x.bandwidth() / 2)
                    .attr("x2", d => x(d.key) + x.bandwidth() / 2)
                    .attr("y1", d => y(d.min))
                    .attr("y2", d => y(d.max));
            },
            exit => exit.remove()
        );
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
            .attr("class", "x-axis") // Classe para atualização
            .attr("transform", `translate(0,${boxPlotConfig.height})`)
            .call(d3.axisBottom(x));

        // Eixo Y
        svg.append("g")
            .attr("class", "y-axis") // Classe para atualização
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
                    .attr("class", "median-line") // Adiciona uma classe para fácil referência
                    .attr("x1", x(d.key))
                    .attr("x2", x(d.key) + x.bandwidth())
                    .attr("y1", y(d.median))
                    .attr("y2", y(d.median))
                    .attr("stroke", "black");

                // Min e Max
                group.append("line")
                    .attr("class", "min-max-line") // Adiciona uma classe para fácil referência
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
        originalData = data.map(d => ({
            ...d,
            G3: +d.G3,
            Medu: +d.Medu,
            Fedu: +d.Fedu
        }));

        // Desenhar o bar chart
        drawBarChart(originalData);

        // Calcular dados para os box plots
        const motherBoxPlotData = calculateBoxPlotData(data, "Medu", "G3");
        const fatherBoxPlotData = calculateBoxPlotData(data, "Fedu", "G3");

        // Desenhar os box plots
        drawBoxPlot("#boxplot-mother", motherBoxPlotData, "Mother's Qualification", "Final Grade");
        drawBoxPlot("#boxplot-father", fatherBoxPlotData, "Father's Qualification", "Final Grade");
    });


});
