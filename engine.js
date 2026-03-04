// Elementos da DOM
const video = document.getElementById('webcam-video');
const canvas = document.getElementById('hidden-canvas');
const context = canvas.getContext('2d');
const emotionResult = document.getElementById('emotion-result');
const emotionChartCanvas = document.getElementById('emotion-chart');
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const endAnalysisBtn = document.getElementById('end-analysis-btn');
const resetBtn = document.getElementById('reset-btn');
const relatorioContainer = document.getElementById('relatorio-container');
const overlayCanvas = document.getElementById('overlay-canvas');
const overlayContext = overlayCanvas.getContext('2d');
const printRelatorioBtn = document.getElementById('print-relatorio-btn');

// Elementos do relatório
const relatorioPessoa = document.getElementById('relatorio-pessoa');
const relatorioData = document.getElementById('relatorio-data');
const relatorioDuracao = document.getElementById('relatorio-duracao');
const relatorioAmostras = document.getElementById('relatorio-amostras');
const relatorioPredominante = document.getElementById('relatorio-predominante');
const relatorioPredominantePerc = document.getElementById('relatorio-predominante-perc');
const relatorioSecundaria = document.getElementById('relatorio-secundaria');
const relatorioSecundariaPerc = document.getElementById('relatorio-secundaria-perc');
const relatorioMenosFrequente = document.getElementById('relatorio-menos-frequente');
const relatorioMenosFrequentePerc = document.getElementById('relatorio-menos-frequente-perc');
const relatorioDistribuicao = document.getElementById('relatorio-distribuicao');
const relatorioAnalise = document.getElementById('relatorio-analise');
const relatorioRecomendacoes = document.getElementById('relatorio-recomendacoes');
const relatorioGeracao = document.getElementById('relatorio-geracao');
const signatureDiv = relatorioContainer.querySelector('.signature');

// Variáveis de Controle
let emotionHistory = [];
let analysisInterval = null;
let startTime = null;
let isAnalyzing = false;
let signatureIndex = 0;
let stream = null;

// Dados dos Doutores para Alternância
const doctors = [
    { name: "Dr. Diego Rocha Serejo", crm: "CRM/Reg.: D.R.S." },
    { name: "Dr. Alan Carlos Santos Dutra", crm: "CRM/Reg.: A.C.S.D." }
];

// Tradução das emoções
const emotionTranslations = {
    'angry': 'Raiva',
    'disgust': 'Nojo',
    'fear': 'Medo',
    'happy': 'Feliz',
    'sad': 'Triste',
    'surprise': 'Surpresa',
    'neutral': 'Neutro'
};

const emotionLabels = Object.values(emotionTranslations);
const chartColors = [
    'rgba(255, 99, 132, 0.6)',
    'rgba(75, 192, 192, 0.6)',
    'rgba(255, 206, 86, 0.6)',
    'rgba(54, 162, 235, 0.6)',
    'rgba(153, 102, 255, 0.6)',
    'rgba(255, 159, 64, 0.6)',
    'rgba(201, 203, 207, 0.6)'
];

const emotionChart = new Chart(emotionChartCanvas, {
    type: 'bar',
    data: {
        labels: emotionLabels,
        datasets: [{
            label: '% de Emoção',
            data: [0, 0, 0, 0, 0, 0, 0],
            backgroundColor: chartColors,
            borderColor: chartColors.map(color => color.replace('0.6', '1')),
            borderWidth: 1
        }]
    },
    options: {
        responsive: true,
        scales: {
            y: {
                beginAtZero: true,
                max: 100
            }
        },
        plugins: {
            legend: {
                display: false
            }
        }
    }
});

// Inicia a webcam e a análise de emoções
async function startWebcam() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: 640,
                height: 480
            }
        });
        video.srcObject = stream;
        
        startTime = new Date();
        isAnalyzing = true;
        startBtn.disabled = true;
        stopBtn.disabled = false;
        emotionResult.innerText = "Análise em andamento...";
        
        // Limpar histórico se existir
        if (emotionHistory.length > 0) {
            emotionHistory = [];
        }
        
        analysisInterval = setInterval(sendFrame, 2000);
    } catch (err) {
        console.error("Erro ao acessar a webcam: ", err);
        emotionResult.innerText = "Erro ao acessar a webcam. Verifique as permissões.";
    }
}

// Para a análise
function stopAnalysis() {
    if (analysisInterval) {
        clearInterval(analysisInterval);
        analysisInterval = null;
    }
    
    isAnalyzing = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    emotionResult.innerText = "Análise interrompida. Clique em 'Iniciar' para continuar.";
}

// Envia o frame para análise
async function sendFrame() {
    try {
        context.drawImage(video, 0, 0, 640, 480);
        
        const data = simulateEmotionAnalysis();

        overlayContext.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

        if (data.face_rect) {
            const { x, y, w, h } = data.face_rect;
            overlayContext.strokeStyle = '#00ff00';
            overlayContext.lineWidth = 2;
            overlayContext.strokeRect(x, y, w, h);
            overlayContext.fillStyle = '#00ff00';
            overlayContext.font = 'bold 20px Arial';
            overlayContext.fillText(data.emocao_dominante_pt, x, y - 10);
        }

        // Calcular índice de engajamento para este frame
        const engajamento = calcularIndiceEngajamento(data.emocoes_detalhadas);
        
        emotionResult.innerText = `Emoção Dominante: ${data.emocao_dominante_pt} | Engajamento: ${engajamento.indice} (${engajamento.interpretacao})`;
        
        // Armazenar dados com o índice calculado
        emotionHistory.push({
            ...data.emocoes_detalhadas,
            indiceEngajamento: engajamento.indice,
            timestamp: new Date()
        });

        updateChart(data.emocoes_detalhadas);

    } catch (err) {
        console.error("Erro na análise:", err);
        emotionResult.innerText = "Erro na análise.";
    }
}

function calcularIndiceEngajamento(emocoes) {
    const foco = emocoes['neutral'] || 0;
    const satisfacao = emocoes['happy'] || 0;
    
    const frustracao = (emocoes['sad'] || 0) + (emocoes['angry'] || 0);
    
    const indice = (foco + satisfacao) - frustracao;
    
    const indiceNormalizado = Math.max(0, Math.min(100, indice));
    
    let interpretacao = 'Baixo';
    if (indiceNormalizado >= 70) interpretacao = 'Alto';
    else if (indiceNormalizado >= 40) interpretacao = 'Moderado';
    
    return {
        indice: indiceNormalizado,
        interpretacao: interpretacao,
        componentes: { foco, satisfacao, frustracao }
    };
}

// Função para atualizar o gráfico
function updateChart(emocoes) {
    const newChartData = emotionLabels.map(label => {
        const eng = Object.keys(emotionTranslations).find(key => emotionTranslations[key] === label);
        return emocoes[eng] || 0;
    });

    emotionChart.data.datasets[0].data = newChartData;
    emotionChart.update();
}

// Função para simular análise de emoções (apenas para demonstração)
function simulateEmotionAnalysis() {
    const emotions = Object.keys(emotionTranslations);
    const dominantEmotion = emotions[Math.floor(Math.random() * emotions.length)];
    
    const emocoes_detalhadas = {};
    let total = 0;
    
    // Gera valores aleatórios para cada emoção
    emotions.forEach(emotion => {
        const value = emotion === dominantEmotion
            ? Math.floor(Math.random() * 30) + 50
            : Math.floor(Math.random() * 30);
        emocoes_detalhadas[emotion] = value;
        total += value;
    });
    
    // Normaliza para que a soma seja 100
    emotions.forEach(emotion => {
        emocoes_detalhadas[emotion] = Math.round((emocoes_detalhadas[emotion] / total) * 100);
    });
    
    // Ajusta para garantir que a soma seja exatamente 100
    const sum = Object.values(emocoes_detalhadas).reduce((a, b) => a + b, 0);
    if (sum !== 100) {
        let currentDominant = '';
        let currentMax = -1;
        for (const [key, value] of Object.entries(emocoes_detalhadas)) {
            if (value > currentMax) {
                currentMax = value;
                currentDominant = key;
            }
        }
        emocoes_detalhadas[currentDominant] += (100 - sum);
    }
    
    return {
        emocao_dominante_pt: emotionTranslations[dominantEmotion],
        emocoes_detalhadas: emocoes_detalhadas,
        face_rect: {
            x: 200 + Math.random() * 50,
            y: 150 + Math.random() * 50,
            w: 200 + Math.random() * 50,
            h: 200 + Math.random() * 50
        }
    };
}

// Geração do Relatório
function generateRelatorio() {
    stopAnalysis();

    if (emotionHistory.length === 0) {
        alert("Nenhum dado coletado. Por favor, inicie a análise primeiro.");
        return;
    }

    // Calcula estatísticas das emoções
    const now = new Date();
    const totalAnalyses = emotionHistory.length;
    const emotionCounts = {};
    
    Object.keys(emotionTranslations).forEach(emotion =>
        emotionCounts[emotionTranslations[emotion]] = 0
    );
    
    emotionHistory.forEach(emotions => {
        for (const [emotion, perc] of Object.entries(emotions)) {
            if (emotion !== 'timestamp') {
                const translatedEmotion = emotionTranslations[emotion] || emotion;
                emotionCounts[translatedEmotion] += perc;
            }
        }
    });
    
    Object.keys(emotionCounts).forEach(translatedEmotion => {
        emotionCounts[translatedEmotion] = emotionCounts[translatedEmotion] / totalAnalyses;
    });
    
    let sortedEmotions = Object.entries(emotionCounts)
        .sort(([, a], [, b]) => b - a)
        .filter(([, value]) => value > 0);
    
    if (sortedEmotions.length === 0) {
        alert("Dados insuficientes para gerar análise.");
        return;
    }
    
    const [mostPredominant, max] = sortedEmotions[0];
    const [secondPredominant, secondMax] = sortedEmotions[1] || ['N/A', 0];
    const [leastPredominant, min] = sortedEmotions[sortedEmotions.length - 1];
    
    preencherCamposRelatorio(now, totalAnalyses, mostPredominant, max,
        secondPredominant, secondMax, leastPredominant, min);
    
    generateAnalysis(mostPredominant, max, leastPredominant, min);
    
    gerarDistribuicaoHTML(sortedEmotions);
    
    // Gerar assinatura
    gerarAssinatura();
    
    // Exibe o relatório
    relatorioContainer.style.display = 'block';
    relatorioContainer.scrollIntoView({ behavior: 'smooth' });
}

function preencherCamposRelatorio(now, totalAnalyses, mostPredominant, max,
    secondPredominant, secondMax, leastPredominant, min) {
    relatorioData.textContent = formatDate(now);
    relatorioGeracao.textContent = formatDateTime(now);
    relatorioAmostras.textContent = totalAnalyses;

    if (startTime) {
        const durationMs = now - startTime;
        const minutes = Math.floor(durationMs / 60000);
        const seconds = Math.floor((durationMs % 60000) / 1000);
        relatorioDuracao.textContent = `${minutes} minuto(s) e ${seconds} segundo(s)`;
    }

    relatorioPredominante.textContent = mostPredominant;
    relatorioPredominantePerc.textContent = `${max.toFixed(1)}% em média`;
    relatorioSecundaria.textContent = secondPredominant;
    relatorioSecundariaPerc.textContent = secondPredominant !== 'N/A' ? `${secondMax.toFixed(1)}% em média` : 'N/A';
    relatorioMenosFrequente.textContent = leastPredominant;
    relatorioMenosFrequentePerc.textContent = `${min.toFixed(1)}% em média`;
}

function gerarDistribuicaoHTML(sortedEmotions) {
    let distribuicaoHTML = '';
    sortedEmotions.forEach(([emotion, avg]) => {
        distribuicaoHTML += `<strong>${emotion}:</strong> ${avg.toFixed(1)}%<br>`;
    });
    relatorioDistribuicao.innerHTML = distribuicaoHTML;
}

function gerarAssinatura() {
    const currentDoctor = doctors[signatureIndex % doctors.length];
    signatureIndex++;

    const signatureHTML = `
        <p style="
            font-family: 'Brush Script MT', 'Lucida Handwriting', cursive; 
            font-size: 24px; 
            margin-bottom: 0px; 
            color: #142155; 
            line-height: 1.1;
        ">
            ${currentDoctor.name}
        </p>
        <p>______________________________________</p>
        <p><strong>${currentDoctor.name}</strong></p>
        <p>Analista do Sistema | ${currentDoctor.crm}</p>
        <p>Sistema de Detecção de Emoções</p>
    `;
    signatureDiv.innerHTML = signatureHTML;
}

// Gera a análise e recomendações
function generateAnalysis(predominant, predomValue, least, leastValue) {
    let analysis = '';
    let recommendations = '';

    switch (predominant) {
        case 'Feliz':
            analysis = `Durante a análise, a emoção predominante foi <strong>${predominant}</strong>, com uma média de ${predomValue.toFixed(1)}% de ocorrência. Isso indica um estado emocional positivo, sugerindo engajamento, satisfação ou bem-estar durante a sessão.`;
            recommendations = `• Manter o ambiente positivo e encorajador<br>• Continuar com as atividades que geram essa resposta positiva<br>• Registrar os fatores que contribuem para essa emoção positiva`;
            break;
        case 'Neutro':
            analysis = `A emoção mais frequente foi <strong>${predominant}</strong>, com média de ${predomValue.toFixed(1)}%. Isso pode indicar concentração, estado de reflexão ou uma resposta emocional contida. Em contextos de aprendizagem ou trabalho, pode ser um sinal de foco.`;
            recommendations = `• Verificar o nível de engajamento com outras métricas<br>• Considerar introduzir elementos que estimulem maior expressividade<br>• Avaliar se o ambiente é confortável para expressão emocional`;
            break;
        case 'Triste':
            analysis = `A emoção predominante detectada foi <strong>${predominant}</strong>, com média de ${predomValue.toFixed(1)}%. Isso pode indicar desânimo, melancolia ou insatisfação. É importante contextualizar essa informação com a situação específica da pessoa.`;
            recommendations = `• Oferecer suporte emocional e escuta ativa<br>• Identificar possíveis causas para essa emoção predominante<br>• Considerar encaminhamento para apoio psicológico se persistente<br>• Introduzir atividades que promovam bem-estar e positividade`;
            break;
        case 'Raiva':
            analysis = `A emoção mais frequente foi <strong>${predominant}</strong>, com média de ${predomValue.toFixed(1)}%. Isso pode indicar frustração, irritação ou contrariedade com alguma situação.`;
            recommendations = `• Identificar fontes de frustração ou estresse<br>• Encorajar comunicação assertiva sobre as causas<br>• Praticar técnicas de manejo da raiva e relaxamento<br>• Considerar pausas regulares em atividades intensas`;
            break;
        case 'Medo':
            analysis = `A emoção predominante detectada foi <strong>${predominant}</strong>, com média de ${predomValue.toFixed(1)}%. Isso pode indicar ansiedade, apreensão ou insegurança em relação à situação.`;
            recommendations = `• Criar um ambiente seguro e previsível<br>• Trabalhar técnicas de redução de ansiedade<br>• Identificar e abordar fontes específicas de medo<br>• Estabelecer metas pequenas e alcançáveis para construir confiança`;
            break;
        case 'Surpresa':
            analysis = `A emoção mais frequente foi <strong>${predominant}</strong>, com média de ${predomValue.toFixed(1)}%. Isso pode indicar reações a eventos inesperados ou novidades no ambiente.`;
            recommendations = `• Avaliar se o nível de surpresa é apropriado ao contexto<br>• Considerar se há elementos imprevisíveis causando desconforto<br>• Manter um equilíbrio entre novidade e rotina`;
            break;
        case 'Nojo':
            analysis = `A emoção predominante detectada foi <strong>${predominant}</strong>, com média de ${predomValue.toFixed(1)}%. Isso pode indicar rejeição, aversão ou forte desagrado em relação a algum aspecto da situação.`;
            recommendations = `• Identificar a fonte da aversão ou desagrado<br>• Modificar elementos do ambiente que causam essa reação<br>• Trabalhar exposição gradual se for uma resposta excessiva<br>• Validar os sentimentos enquanto se busca adaptação`;
            break;
        default:
            analysis = `A emoção predominante foi <strong>${predominant}</strong>, com média de ${predomValue.toFixed(1)}%.`;
            recommendations = `• Continuar monitoramento para padrões adicionais<br>• Correlacionar com outras métricas de comportamento<br>• Considerar contexto específico para interpretação`;
    }

    if (least !== 'N/A') {
        analysis += ` A emoção menos expressa foi <strong>${least}</strong>, com média de ${leastValue.toFixed(1)}%.`;
    }

    relatorioAnalise.innerHTML = analysis;
    relatorioRecomendacoes.innerHTML = recommendations;
}


// Função para reiniciar a análise
async function resetAnalysis() {
    // Parar análise se estiver em andamento
    stopAnalysis();
    
    // Parar webcam
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
    
    // Limpar dados
    emotionHistory = [];
    startTime = null;
    
    // Limpar overlay
    overlayContext.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    
    // Resetar gráfico
    emotionChart.data.datasets[0].data = [0, 0, 0, 0, 0, 0, 0];
    emotionChart.update();
    
    // Resetar resultado
    emotionResult.innerText = "Aguardando início da análise...";
    
    // Esconder relatório
    relatorioContainer.style.display = 'none';
    
    // Habilitar botão start
    startBtn.disabled = false;
    stopBtn.disabled = true;
    
    // Solicitar novo nome da pessoa
    setTimeout(() => {
        const pessoa = prompt("Por favor, insira o nome da pessoa para o relatório:", "Pessoa Exemplo");
        if (pessoa) {
            relatorioPessoa.textContent = pessoa;
        }
    }, 100);
}

// Funções auxiliares
function formatDate(date) {
    return date.toLocaleDateString('pt-BR');
}

function formatDateTime(date) {
    return date.toLocaleString('pt-BR');
}

// Event Listeners
startBtn.addEventListener('click', startWebcam);
stopBtn.addEventListener('click', stopAnalysis);
endAnalysisBtn.addEventListener('click', generateRelatorio);
resetBtn.addEventListener('click', resetAnalysis);
printRelatorioBtn.addEventListener('click', () => window.print());

// Solicitar nome da pessoa ao carregar a página
window.addEventListener('load', () => {
    setTimeout(() => {
        const pessoa = prompt("Por favor, insira o nome da pessoa para o relatório:", "Pessoa Exemplo");
        if (pessoa) {
            relatorioPessoa.textContent = pessoa;
        }
    }, 500);
});