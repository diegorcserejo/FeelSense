// Elementos do DOM - Captura e Vídeo
const video = document.getElementById('webcam-video');
const canvas = document.getElementById('hidden-canvas');
const context = canvas.getContext('2d');
const overlayCanvas = document.getElementById('overlay-canvas');
const overlayContext = overlayCanvas.getContext('2d');
const liveBadge = document.getElementById('live-badge');

// Elementos do DOM - Controles e Gráfico
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const endAnalysisBtn = document.getElementById('end-analysis-btn');
const emotionResult = document.getElementById('emotion-result');
const emotionChartCanvas = document.getElementById('emotion-chart');

// Elementos do DOM - KPIs da Tela
const kpiSamples = document.getElementById('kpi-samples');
const kpiEngagement = document.getElementById('kpi-engagement');
const kpiDominant = document.getElementById('kpi-dominant');
const insightValueSpan = document.getElementById('insight-dominant'); // Corrigido para o ID correto do Insight

// Elementos do DOM - Relatório
const relatorioContainer = document.getElementById('relatorio-container');
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
const printRelatorioBtn = document.getElementById('print-relatorio-btn');

// Variáveis de Estado de Controle
let emotionHistory = [];
let analysisInterval = null;
let startTime = null;
let stream = null;

// Configurações Globais
const emotionTranslations = {
    'angry': 'Raiva', 'disgust': 'Nojo', 'fear': 'Medo',
    'happy': 'Feliz', 'sad': 'Triste', 'surprise': 'Surpresa', 'neutral': 'Neutro'
};
const emotionLabels = Object.values(emotionTranslations);
const chartColors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#95e77e', '#ff9f4a', '#c084fc', '#94a3b8'];

// Inicialização do Gráfico Chart.js (Com correções para expandir e preencher o CSS)
const emotionChart = new Chart(emotionChartCanvas, {
    type: 'bar',
    data: { 
        labels: emotionLabels, 
        datasets: [{ 
            label: '%', 
            data: [0,0,0,0,0,0,0], 
            backgroundColor: chartColors, 
            borderRadius: 8, 
            borderSkipped: false 
        }] 
    },
    options: { 
        responsive: true, 
        maintainAspectRatio: false, // OBRIGATÓRIO: Permite que o gráfico cresça verticalmente preenchendo o espaço
        scales: { 
            y: { 
                beginAtZero: true, 
                max: 100, 
                grid: { color: 'rgba(255,255,255,0.1)' }, 
                ticks: { color: '#94a3b8' } 
            }, 
            x: { 
                ticks: { color: '#94a3b8' } 
            } 
        }, 
        plugins: { 
            legend: { display: false } 
        } 
    }
});

// Partículas de Fundo Estilizadas
function createParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    for (let i = 0; i < 60; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        particle.style.cssText = `
            width: ${Math.random() * 4 + 1}px;
            height: ${Math.random() * 4 + 1}px;
            background: radial-gradient(circle, ${Math.random() > 0.5 ? '#8b5cf6' : '#6366f1'}, transparent);
            top: ${Math.random() * 100}%;
            left: ${Math.random() * 100}%;
            animation-duration: ${Math.random() * 8 + 5}s;
            animation-delay: ${Math.random() * 5}s;
        `;
        container.appendChild(particle);
    }
}

// Ativação da Câmera e Fluxo de Dados
async function startWebcam() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
        video.srcObject = stream;
        startTime = new Date();
        emotionHistory = [];
        
        startBtn.disabled = true;
        stopBtn.disabled = false;
        
        liveBadge.innerText = 'LIVE';
        liveBadge.style.background = '#22c55e';
        liveBadge.style.color = 'black';
        
        emotionResult.innerHTML = '<i class="fas fa-chart-line"></i> Análise em tempo real ativada';
        analysisInterval = setInterval(sendFrame, 1800);
    } catch (err) { 
        emotionResult.innerHTML = "<i class='fas fa-exclamation-triangle'></i> Erro na webcam"; 
    }
}

// Pausa na Análise
function stopAnalysis() {
    if (analysisInterval) clearInterval(analysisInterval);
    analysisInterval = null;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    
    liveBadge.innerText = 'Standby';
    liveBadge.style.background = '#dcfce7';
    liveBadge.style.color = '#15803d';
    emotionResult.innerHTML = '<i class="fas fa-pause-circle"></i> Análise interrompida';
}

// Processamento de Frames (Simulado)
async function sendFrame() {
    if (!video.videoWidth) return;
    context.drawImage(video, 0, 0, 640, 480);
    
    const data = simulateEmotionAnalysis();
    overlayContext.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    
    if (data.face_rect) {
        const { x, y, w, h } = data.face_rect;
        overlayContext.strokeStyle = '#8b5cf6';
        overlayContext.lineWidth = 3;
        overlayContext.strokeRect(x, y, w, h);
        
        // Renderização de texto invertido para compensar espelhamento CSS
        overlayContext.fillStyle = '#c084fc';
        overlayContext.font = 'bold 18px Inter';
        overlayContext.textBaseline = 'top';
        overlayContext.save();
        overlayContext.setTransform(-1, 0, 0, 1, overlayCanvas.width, 0);
        overlayContext.fillText(data.emocao_dominante_pt, overlayCanvas.width - x, y - 8);
        overlayContext.restore();
    }
    
    const engajamento = calcularIndiceEngajamento(data.emocoes_detalhadas);
    emotionResult.innerHTML = `<i class="fas fa-smile"></i> Dominante: ${data.emocao_dominante_pt} | Engajamento: ${engajamento.indice}% (${engajamento.interpretacao})`;
    
    // Atualização dos elementos do Dashboard
    if (kpiDominant) kpiDominant.innerText = data.emocao_dominante_pt;
    if (kpiEngagement) kpiEngagement.innerText = `${engajamento.indice}%`;
    if (insightValueSpan) insightValueSpan.innerText = `Emoção atual: ${data.emocao_dominante_pt}`;
    
    emotionHistory.push({ ...data.emocoes_detalhadas, indiceEngajamento: engajamento.indice, timestamp: new Date() });
    if (kpiSamples) kpiSamples.innerText = emotionHistory.length;
    
    updateChart(data.emocoes_detalhadas);
}

// Regra de Negócio: Mapeamento de Engajamento
function calcularIndiceEngajamento(emocoes) {
    const foco = emocoes['neutral'] || 0;
    const satisfacao = emocoes['happy'] || 0;
    const frustracao = (emocoes['sad'] || 0) + (emocoes['angry'] || 0);
    let indice = Math.min(100, Math.max(0, (foco + satisfacao) - frustracao));
    let interpretacao = indice >= 70 ? 'Alto' : (indice >= 40 ? 'Moderado' : 'Baixo');
    return { indice, interpretacao };
}

// Atualização de Dados no Gráfico
function updateChart(emocoes) {
    const newData = emotionLabels.map(label => {
        const eng = Object.keys(emotionTranslations).find(key => emotionTranslations[key] === label);
        return emocoes[eng] || 0;
    });
    emotionChart.data.datasets[0].data = newData;
    emotionChart.update();
}

// Simulador Estocástico de Inteligência Artificial
function simulateEmotionAnalysis() {
    const emotions = Object.keys(emotionTranslations);
    const dominantEmotion = emotions[Math.floor(Math.random() * emotions.length)];
    const emocoes_detalhadas = {};
    let total = 0;
    
    emotions.forEach(emotion => {
        let val = emotion === dominantEmotion ? Math.floor(Math.random() * 40) + 50 : Math.floor(Math.random() * 20) + 5;
        emocoes_detalhadas[emotion] = val;
        total += val;
    });
    
    emotions.forEach(emotion => { emocoes_detalhadas[emotion] = Math.round((emocoes_detalhadas[emotion] / total) * 100); });
    const sum = Object.values(emocoes_detalhadas).reduce((a,b)=>a+b,0);
    if(sum !== 100) emocoes_detalhadas[dominantEmotion] += (100 - sum);
    
    return {
        emocao_dominante_pt: emotionTranslations[dominantEmotion],
        emocoes_detalhadas,
        face_rect: { x: 180 + Math.random()*60, y: 120 + Math.random()*60, w: 190 + Math.random()*50, h: 190 + Math.random()*50 }
    };
}

// Processamento Analítico e Geração de Relatório
function generateRelatorio() {
    if(emotionHistory.length === 0) { 
        alert("Nenhum dado capturado ainda. Por favor, inicie a análise primeiro."); 
        return; 
    }
    stopAnalysis();
    
    const now = new Date();
    const total = emotionHistory.length;
    const emotionCounts = {};
    
    Object.keys(emotionTranslations).forEach(e => emotionCounts[emotionTranslations[e]] = 0);
    
    emotionHistory.forEach(em => {
        for(let [key, val] of Object.entries(em)) {
            if(key !== 'timestamp' && key !== 'indiceEngajamento') {
                let translated = emotionTranslations[key] || key;
                emotionCounts[translated] += val;
            }
        }
    });
    
    Object.keys(emotionCounts).forEach(k => emotionCounts[k] /= total);
    let sorted = Object.entries(emotionCounts).sort((a,b)=>b[1]-a[1]).filter(e=>e[1]>0);
    
    const [pred, predVal] = sorted[0];
    const [sec, secVal] = sorted[1] || ['N/A', 0];
    const [least, leastVal] = sorted[sorted.length-1];
    
    // Alimentação de dados de cabeçalho
    relatorioData.textContent = now.toLocaleDateString('pt-BR');
    relatorioGeracao.textContent = now.toLocaleString('pt-BR');
    relatorioAmostras.textContent = total;
    
    if(startTime) { 
        let diff = Math.floor((now - startTime) / 1000); 
        relatorioDuracao.textContent = `${Math.floor(diff / 60)}m ${diff % 60}s`; 
    }
    
    // Cards de KPI de Distribuição no Relatório
    relatorioPredominante.textContent = pred;
    relatorioPredominantePerc.textContent = `${predVal.toFixed(1)}%`;
    document.getElementById('predominante-fill').style.width = `${predVal}%`;
    
    relatorioSecundaria.textContent = sec;
    relatorioSecundariaPerc.textContent = secVal > 0 ? `${secVal.toFixed(1)}%` : 'N/A';
    document.getElementById('secundaria-fill').style.width = `${secVal}%`;
    
    relatorioMenosFrequente.textContent = least;
    relatorioMenosFrequentePerc.textContent = `${leastVal.toFixed(1)}%`;
    document.getElementById('menos-fill').style.width = `${leastVal}%`;
    
    // Distribuição das tags de emoções em Grid
    let distHTML = '';
    sorted.forEach(([emo, perc]) => {
        const iconMap = { 'Feliz': 'fa-smile', 'Triste': 'fa-frown', 'Neutro': 'fa-meh', 'Raiva': 'fa-angry', 'Medo': 'fa-flushed', 'Surpresa': 'fa-surprise', 'Nojo': 'fa-tired' };
        const icon = iconMap[emo] || 'fa-face-smile';
        distHTML += `<div class="emotion-tag"><span class="emotion-name"><i class="fas ${icon}"></i> ${emo}</span><span class="emotion-percent">${perc.toFixed(1)}%</span></div>`;
    });
    relatorioDistribuicao.innerHTML = distHTML;
    
    // Análise Cognitiva Dinâmica baseada no Predominante
    let analysisText = `A emoção predominante foi ${pred} (${predVal.toFixed(1)}% média). `;
    if(pred === 'Feliz') analysisText += "Indica engajamento positivo e bem-estar durante a sessão, sugerindo uma experiência agradável.";
    else if(pred === 'Neutro') analysisText += "Revela estado de concentração ou resposta contida, podendo indicar foco ou neutralidade emocional.";
    else if(pred === 'Triste') analysisText += "Pode sinalizar desânimo, importante considerar contexto e oferecer suporte emocional.";
    else if(pred === 'Raiva') analysisText += "Sugere irritabilidade ou frustração, recomendando abordagem cuidadosa.";
    else if(pred === 'Medo') analysisText += "Indica ansiedade ou apreensão, necessitando ambiente seguro.";
    else analysisText += "Monitoramento completo disponível para suporte emocional contínuo.";
    
    relatorioAnalise.innerHTML = analysisText;
    
    let recText = "• Continue promovendo ambiente acolhedor e positivo.<br>• Utilize os dados para ajustar estratégias de engajamento.<br>• Aconselhamento preventivo conforme frequência emocional identificada.";
    if(pred === 'Triste' || pred === 'Raiva') recText = "• Recomenda-se acolhimento imediato.<br>• Estratégias de regulação emocional são sugeridas.<br>• Acompanhamento sistemático indicado.";
    if(pred === 'Feliz') recText = "• Manter ambiente positivo e reforçar comportamentos.<br>• Aumentar desafios para manter engajamento.<br>• Celebrar resultados positivos.";
    
    relatorioRecomendacoes.innerHTML = recText;
    
    relatorioContainer.style.display = 'block';
    relatorioContainer.scrollIntoView({ behavior: 'smooth' });
}

endAnalysisBtn.addEventListener('click', generateRelatorio);
startBtn.addEventListener('click', startWebcam);
stopBtn.addEventListener('click', stopAnalysis);
printRelatorioBtn.addEventListener('click', () => window.print());

window.addEventListener('load', () => {
    createParticles();
    setTimeout(() => {
        let nome = prompt("Nome para o relatório:", "Usuário");
        if(nome && nome.trim()) {
            relatorioPessoa.textContent = nome;
        }
    }, 500);
});