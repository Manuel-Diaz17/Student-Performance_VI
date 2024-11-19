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
    
        // Desenhar as barras
        svg.selectAll("rect")
            .data(gradeCounts)
            .enter()
            .append("rect")
            .attr("x", d => x(d.grade))
            .attr("y", d => y(d.count))
            .attr("width", x.bandwidth()) // Largura de cada barra
            .attr("height", d => height - y(d.count)) // Altura da barra
            .attr("fill", "#69b3a2");
    
        // Título do gráfico
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", -10)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .text("Distribuição das Notas Finais");
            
    }).catch(error => {
        console.error("Erro ao carregar os dados:", error);
    });
        

});
