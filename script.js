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
});
