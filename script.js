const video = document.getElementById('webcam-video');
const canvas = document.getElementById('hidden-canvas');
const context = canvas.getContext('2d');
const emotionResult = document.getElementById('emotion-result');
const emotionChartCanvas = document.getElementById('emotion-chart');
const endAnalysisBtn = document.getElementById('end-analysis-btn');
const laudoContainer = document.getElementById('laudo-container');
const laudoText = document.getElementById('laudo-text');
const overlayCanvas = document.getElementById('overlay-canvas');
const overlayContext = overlayCanvas.getContext('2d');

// Configuração inicial do gráfico
const emotionLabels = ['Raiva', 'Nojo', 'Medo', 'Feliz', 'Triste', 'Surpresa', 'Neutro'];
const chartData = {
    labels: emotionLabels,
    datasets: [{
        label: '% de Emoção',
        data: [0, 0, 0, 0, 0, 0, 0],
        backgroundColor: [
            'rgba(255, 99, 132, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(153, 102, 255, 0.6)',
            'rgba(255, 159, 64, 0.6)',
            'rgba(201, 203, 207, 0.6)'
        ],
        borderColor: [
            'rgb(255, 99, 132)',
            'rgb(75, 192, 192)',
            'rgb(255, 206, 86)',
            'rgb(54, 162, 235)',
            'rgb(153, 102, 255)',
            'rgb(255, 159, 64)',
            'rgb(201, 203, 207)'
        ],
        borderWidth: 1
    }]
};
const config = {
    type: 'bar',
    data: chartData,
    options: {
        responsive: true,
        scales: {
            y: {
                beginAtZero: true,
                max: 100
            }
        }
    }
};
const emotionChart = new Chart(emotionChartCanvas, config);

// Array para armazenar o histórico das emoções detectadas
let emotionHistory = [];
let analysisInterval = null;

// Mapeamento de emoções em inglês para português
const emotionTranslations = {
    'angry': 'Raiva',
    'disgust': 'Nojo',
    'fear': 'Medo',
    'happy': 'Feliz',
    'sad': 'Triste',
    'surprise': 'Surpresa',
    'neutral': 'Neutro'
};

// Inicia a webcam e a análise de emoções
async function startWebcam() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        video.play();
        // Armazena a referência do setInterval para poder pará-lo depois
        analysisInterval = setInterval(sendFrame, 2000); // Envia um frame a cada 2 segundos
    } catch (err) {
        console.error("Erro ao acessar a webcam: ", err);
    }
}

// Envia o frame para o backend para análise
async function sendFrame() {
    context.drawImage(video, 0, 0, 640, 480);
    const imageData = canvas.toDataURL('image/jpeg');

    try {
        const response = await fetch('http://localhost:5000/analyze-emotion', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ image: imageData })
        });
        const data = await response.json();

        // Limpa o canvas de sobreposição antes de desenhar
        overlayContext.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

        if (data.error) {
            emotionResult.innerText = data.error;
            return;
        }

        // NOVO: Desenha o retângulo e o texto no canvas de sobreposição
        if (data.face_rect) {
            const { x, y, w, h } = data.face_rect;
            
            // Desenha o retângulo
            overlayContext.strokeStyle = '#00ff00';
            overlayContext.lineWidth = 2;
            overlayContext.strokeRect(x, y, w, h);
            
            // Adiciona o texto da emoção
            overlayContext.fillStyle = '#00ff00';
            overlayContext.font = 'bold 20px Arial';
            overlayContext.fillText(data.emocao_dominante_pt, x, y - 10);
        }

        // Atualizando o texto da emoção dominante
        emotionResult.innerText = `Emoção Dominante: ${data.emocao_dominante_pt}`;

        // Armazena o resultado no histórico
        emotionHistory.push(data.emocoes_detalhadas);

        // **Ajuste AQUI para corrigir o gráfico!**
        // Mapeia os dados do Python (chaves em inglês) para os rótulos do gráfico (em português)
        const newChartData = emotionLabels.map(label => {
            const originalEmotion = Object.keys(emotionTranslations).find(key => emotionTranslations[key] === label);
            return data.emocoes_detalhadas[originalEmotion] || 0;
        });
        
        emotionChart.data.datasets[0].data = newChartData;
        emotionChart.update();

    } catch (err) {
        console.error("Erro na comunicação com o servidor: ", err);
        emotionResult.innerText = "Erro na comunicação.";
    }
}

// Função para gerar o laudo final
function generateLaudo() {
    // Para a análise em tempo real
    clearInterval(analysisInterval);

    if (emotionHistory.length === 0) {
        laudoText.innerText = "Nenhum dado de emoção foi coletado. Por favor, inicie a análise.";
        return;
    }

    const totalAnalyses = emotionHistory.length;
    const emotionCounts = {};

    // Soma as porcentagens de cada emoção ao longo do tempo
    emotionHistory.forEach(emotions => {
        for (const [emotion, percentage] of Object.entries(emotions)) {
            const translatedEmotion = emotionTranslations[emotion] || emotion;
            if (!emotionCounts[translatedEmotion]) {
                emotionCounts[translatedEmotion] = 0;
            }
            emotionCounts[translatedEmotion] += percentage;
        }
    });

    // Encontra a emoção predominante e a menos predominante
    let mostPredominant = '';
    let leastPredominant = '';
    let maxPercentage = -1;
    let minPercentage = Infinity;

    for (const [emotion, totalPercentage] of Object.entries(emotionCounts)) {
        if (totalPercentage > maxPercentage) {
            maxPercentage = totalPercentage;
            mostPredominant = emotion;
        }
        if (totalPercentage < minPercentage) {
            minPercentage = totalPercentage;
            leastPredominant = emotion;
        }
    }

    // Gera o texto do laudo com base na emoção predominante e menos predominante
    let laudo = `Durante a análise, a emoção mais predominante foi **${mostPredominant}** (média de ${(maxPercentage / totalAnalyses).toFixed(2)}%).`;
    laudo += `<br>A emoção menos predominante foi **${leastPredominant}** (média de ${(minPercentage / totalAnalyses).toFixed(2)}%).`;

    // Recomendações personalizadas
    if (mostPredominant === 'Feliz') {
        laudo += "<br><br>Recomendação: O alto índice de felicidade indica que o conteúdo e a forma de ensino foram positivos e engajadores. Continue usando metodologias que incentivem a participação e a interação, como atividades em grupo ou debates.";
    } else if (mostPredominant === 'Neutro') {
        laudo += "<br><br>Recomendação: A predominância da emoção neutra pode sugerir alta concentração, mas também passividade. Sugere-se a inclusão de perguntas, enquetes ou atividades interativas para aumentar o engajamento e verificar a compreensão do conteúdo.";
    } else if (mostPredominant === 'Triste' || mostPredominant === 'Nojo' || mostPredominant === 'Raiva') {
        laudo += "<br><br>Recomendação: A predominância de emoções negativas pode indicar que o aluno está com dificuldades, desinteressado ou frustrado. É importante que o professor ofereça um feedback individualizado, revise a matéria ou adapte a abordagem pedagógica para garantir que o aluno não seja deixado para trás.";
    } else {
        laudo += "<br><br>Recomendação: Para obter uma análise mais precisa, é recomendado utilizar este sistema em conjunto com outras ferramentas de feedback, como avaliações, questionários e conversas com os alunos.";
    }

    // Exibe o laudo
    laudoText.innerHTML = laudo;
    laudoContainer.style.display = 'block';
    endAnalysisBtn.style.display = 'none'; // Esconde o botão após o laudo
    emotionResult.style.display = 'none';
}

// Adiciona o evento de clique no botão
endAnalysisBtn.addEventListener('click', generateLaudo);

startWebcam();