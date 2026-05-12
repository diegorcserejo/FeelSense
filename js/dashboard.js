// dashboard.js - Versão com Face-api.js REAL para TCC
// ==================================================

// ============ ELEMENTOS DO DOM ============
const video = document.getElementById('webcam-video');
const canvas = document.getElementById('hidden-canvas');
const context = canvas.getContext('2d');
const emotionResult = document.getElementById('emotion-result');
const emotionChartCanvas = document.getElementById('emotion-chart');
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const endAnalysisBtn = document.getElementById('end-analysis-btn');
const relatorioContainer = document.getElementById('relatorio-container');
const overlayCanvas = document.getElementById('overlay-canvas');
const overlayContext = overlayCanvas.getContext('2d');
const printRelatorioBtn = document.getElementById('print-relatorio-btn');

// ============ ELEMENTOS DO RELATÓRIO ============
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
const signatureContainer = document.getElementById('signature-container');

// ============ KPIs ============
const kpiSamples = document.getElementById('kpi-samples');
const kpiEngagement = document.getElementById('kpi-engagement');
const kpiDominant = document.getElementById('kpi-dominant');
const insightValueSpan = document.querySelector('.insight-value');
const liveBadge = document.getElementById('live-badge');

// ============ VARIÁVEIS GLOBAIS ============
let emotionHistory = [];
let analysisInterval = null;
let startTime = null;
let stream = null;
let modelsLoaded = false;
let detectionInterval = null;

// ============ TRADUÇÃO DAS EMOÇÕES ============
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
const chartColors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#95e77e', '#ff9f4a', '#c084fc', '#94a3b8'];

// ============ GRÁFICO ============
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
        maintainAspectRatio: true, 
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
        plugins: { legend: { display: false } } 
    }
});

// ============ PARTÍCULAS (ANIMAÇÃO) ============
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

// ============ FACE-API: CARREGAR MODELOS ============
async function loadFaceApiModels() {
    emotionResult.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Carregando modelos de IA...';
    
    try {
        const modelUrl = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
        
        await faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl);
        await faceapi.nets.faceExpressionNet.loadFromUri(modelUrl);
        
        modelsLoaded = true;
        emotionResult.innerHTML = '<i class="fas fa-check-circle"></i> Modelos prontos! Clique em Iniciar';
        console.log('✅ Modelos Face-api carregados com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao carregar modelos:', error);
        emotionResult.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Erro ao carregar IA. Verifique sua conexão com a internet.';
    }
}
// ============ INICIAR WEBCAM ============
async function startWebcam() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: 640, height: 480 } 
        });
        video.srcObject = stream;
        startTime = new Date();
        emotionHistory = [];
        
        // Carrega modelos se ainda não foram carregados
        if (!modelsLoaded) {
            await loadFaceApiModels();
        }
        
        startBtn.disabled = true;
        stopBtn.disabled = false;
        liveBadge.innerText = 'LIVE';
        liveBadge.style.background = '#22c55e';
        liveBadge.style.color = 'black';
        emotionResult.innerHTML = '<i class="fas fa-chart-line"></i> Analisando expressões faciais...';
        
        // Inicia análise a cada 2 segundos
        detectionInterval = setInterval(detectEmotions, 2000);
        
    } catch (err) {
        console.error('Erro na webcam:', err);
        emotionResult.innerHTML = "<i class='fas fa-exclamation-triangle'></i> Erro ao acessar webcam. Verifique as permissões.";
    }
}

// ============ PARAR ANÁLISE ============
function stopAnalysis() {
    if (detectionInterval) {
        clearInterval(detectionInterval);
        detectionInterval = null;
    }
    
    startBtn.disabled = false;
    stopBtn.disabled = true;
    liveBadge.innerText = 'Standby';
    liveBadge.style.background = '#dcfce7';
    liveBadge.style.color = '#15803d';
    emotionResult.innerHTML = '<i class="fas fa-pause-circle"></i> Análise interrompida';
    
    // Para a webcam
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
}

// ============ DETECTAR EMOÇÕES COM FACE-API ============
async function detectEmotions() {
    if (!video.videoWidth || !video.videoHeight) return;
    if (!modelsLoaded) return;
    
    try {
        // Detecta rosto e expressões
        const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceExpressions();
        
        if (detection) {
            const expressions = detection.expressions;
            
            // Encontra emoção dominante (maior probabilidade)
            const entries = Object.entries(expressions);
            const dominant = entries.reduce((a, b) => a[1] > b[1] ? a : b);
            const emotionPt = emotionTranslations[dominant[0]] || dominant[0];
            const confidence = (dominant[1] * 100).toFixed(1);
            
            // Atualiza UI
            emotionResult.innerHTML = `<i class="fas fa-face-smile"></i> ${emotionPt} (confiança: ${confidence}%)`;
            kpiDominant.innerText = emotionPt;
            insightValueSpan.innerText = `Emoção: ${emotionPt} (${confidence}%)`;
            
            // Salva no histórico (com valores originais)
            emotionHistory.push({
                ...expressions,
                timestamp: new Date(),
                confianca: dominant[1],
                emocao_dominante: dominant[0]
            });
            
            // Atualiza contador
            kpiSamples.innerText = emotionHistory.length;
            
            // Atualiza gráfico
            updateChart(expressions);
            
            // Calcula e atualiza engajamento
            updateEngagement(expressions);
            
            // Desenha bounding box
            drawFaceBox(detection.detection.box);
            
        } else {
            emotionResult.innerHTML = '<i class="fas fa-user-slash"></i> Nenhum rosto detectado. Ajuste a câmera e iluminação.';
            // Limpa overlay
            overlayContext.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
        }
    } catch (error) {
        console.error('Erro na detecção:', error);
        emotionResult.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Erro na análise facial';
    }
}

// ============ DESENHAR QUADRO DO ROSTO ============
function drawFaceBox(box) {
    overlayContext.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    overlayContext.strokeStyle = '#8b5cf6';
    overlayContext.lineWidth = 3;
    overlayContext.strokeRect(box.x, box.y, box.width, box.height);
    
    // Adiciona efeito de gradiente no quadro
    overlayContext.shadowBlur = 10;
    overlayContext.shadowColor = '#8b5cf6';
    overlayContext.strokeRect(box.x, box.y, box.width, box.height);
    overlayContext.shadowBlur = 0;
}

// ============ ATUALIZAR GRÁFICO ============
function updateChart(expressions) {
    const newData = emotionLabels.map(label => {
        const engKey = Object.keys(emotionTranslations).find(key => emotionTranslations[key] === label);
        const value = expressions[engKey] || 0;
        return Math.round(value * 100); // Converte para porcentagem
    });
    
    emotionChart.data.datasets[0].data = newData;
    emotionChart.update();
}

// ============ CALCULAR ÍNDICE DE ENGAJAMENTO ============
function updateEngagement(expressions) {
    // Peso para cada emoção
    const happy = expressions.happy || 0;
    const surprised = expressions.surprise || 0;
    const neutral = expressions.neutral || 0;
    const sad = expressions.sad || 0;
    const angry = expressions.angry || 0;
    const fear = expressions.fear || 0;
    const disgust = expressions.disgust || 0;
    
    // Fórmula de engajamento: 
    // Feliz e Surpresa somam positivamente
    // Neutro conta pouco
    // Negativas (Triste, Raiva, Medo, Nojo) reduzem
    let engagement = (happy * 2.0) + (surprised * 1.5) + (neutral * 0.3);
    engagement = engagement - (sad * 0.8) - (angry * 1.0) - (fear * 0.5) - (disgust * 0.5);
    
    // Normaliza para 0-100
    engagement = Math.min(100, Math.max(0, engagement * 20));
    
    let interpretacao = '';
    if (engagement >= 70) interpretacao = 'Alto 🟢';
    else if (engagement >= 40) interpretacao = 'Moderado 🟡';
    else interpretacao = 'Baixo 🔴';
    
    kpiEngagement.innerText = `${Math.round(engagement)}%`;
    
    // Atualiza tendência
    const trendSpan = document.getElementById('engagement-trend');
    if (trendSpan) {
        trendSpan.innerHTML = interpretacao;
        if (engagement >= 70) trendSpan.style.color = '#22c55e';
        else if (engagement >= 40) trendSpan.style.color = '#eab308';
        else trendSpan.style.color = '#ef4444';
    }
    
    return { engagement: Math.round(engagement), interpretacao };
}

// ============ GERAR RELATÓRIO ============
function generateRelatorio() {
    if (emotionHistory.length === 0) { 
        alert("Nenhum dado coletado. Inicie a análise primeiro."); 
        return; 
    }
    
    stopAnalysis();
    
    const now = new Date();
    const total = emotionHistory.length;
    
    // Contagem das emoções
    const emotionCounts = {};
    Object.keys(emotionTranslations).forEach(e => emotionCounts[emotionTranslations[e]] = 0);
    
    emotionHistory.forEach(em => {
        for (let [key, val] of Object.entries(em)) {
            if (key !== 'timestamp' && key !== 'confianca' && key !== 'emocao_dominante' && typeof val === 'number') {
                let translated = emotionTranslations[key] || key;
                emotionCounts[translated] += val;
            }
        }
    });
    
    // Média das porcentagens
    Object.keys(emotionCounts).forEach(k => emotionCounts[k] = (emotionCounts[k] / total) * 100);
    
    // Ordenar por frequência
    let sorted = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1]).filter(e => e[1] > 0);
    const [pred, predVal] = sorted[0];
    const [sec, secVal] = sorted[1] || ['N/A', 0];
    const [least, leastVal] = sorted[sorted.length - 1] || ['N/A', 0];
    
    // Preencher relatório
    relatorioData.textContent = now.toLocaleDateString('pt-BR');
    relatorioGeracao.textContent = now.toLocaleString('pt-BR');
    relatorioAmostras.textContent = total;
    
    if (startTime) { 
        let diff = Math.floor((now - startTime) / 1000); 
        relatorioDuracao.textContent = `${Math.floor(diff / 60)}m ${diff % 60}s`; 
    }
    
    relatorioPredominante.textContent = pred;
    relatorioPredominantePerc.textContent = `${predVal.toFixed(1)}%`;
    relatorioSecundaria.textContent = sec;
    relatorioSecundariaPerc.textContent = secVal > 0 ? `${secVal.toFixed(1)}%` : 'N/A';
    relatorioMenosFrequente.textContent = least;
    relatorioMenosFrequentePerc.textContent = `${leastVal.toFixed(1)}%`;
    
    // Distribuição detalhada
    let distHTML = '';
    sorted.forEach(([emo, perc]) => { 
        distHTML += `<div style="display:flex; justify-content:space-between; padding:8px; border-bottom:1px solid rgba(255,255,255,0.1);">
                        <strong>${emo}</strong> 
                        <span>${perc.toFixed(1)}%</span>
                     </div>`; 
    });
    relatorioDistribuicao.innerHTML = distHTML;
    
    // Análise textual
    let analysisText = `Durante a sessão de ${relatorioDuracao.textContent}, foram coletadas ${total} amostras. `;
    analysisText += `A emoção predominante foi ${pred} com ${predVal.toFixed(1)}% das detecções. `;
    
    if (pred === 'Feliz') {
        analysisText += "Este resultado indica um alto nível de engajamento positivo e satisfação durante a atividade.";
    } else if (pred === 'Neutro') {
        analysisText += "O estado neutro predominante pode indicar concentração ou atenção focada, mas também pode sugerir baixa reatividade emocional ao conteúdo.";
    } else if (pred === 'Triste') {
        analysisText += "A predominância de tristeza merece atenção, podendo indicar desmotivação ou dificuldade com o conteúdo apresentado.";
    } else if (pred === 'Surpresa') {
        analysisText += "A presença frequente de surpresa sugere que o conteúdo está gerando novidade e captando a atenção do participante.";
    } else {
        analysisText += "Sugere-se uma análise mais aprofundada do contexto para entender os gatilhos emocionais identificados.";
    }
    
    relatorioAnalise.innerHTML = analysisText;
    
    // Recomendações
    let recomendacoes = '';
    if (pred === 'Feliz') {
        recomendacoes = '• Continue utilizando estratégias que geram emoções positivas.<br>• Considere aumentar a complexidade gradualmente.';
    } else if (pred === 'Neutro') {
        recomendacoes = '• Insira elementos interativos para aumentar o engajamento.<br>• Varie o formato do conteúdo (vídeos, perguntas, gamificação).';
    } else if (pred === 'Triste') {
        recomendacoes = '• Revise o conteúdo e ritmo da aula.<br>• Ofereça suporte adicional e pause para esclarecimento de dúvidas.';
    } else {
        recomendacoes = '• Continue monitorando as reações emocionais.<br>• Adapte a estratégia conforme o perfil do participante.';
    }
    relatorioRecomendacoes.innerHTML = recomendacoes;
    
    // Assinatura
    signatureContainer.innerHTML = `<div style="font-family:'Brush Script MT', cursive; font-size:26px; background:linear-gradient(135deg,#c084fc,#8b5cf6); -webkit-background-clip:text; background-clip:text; color:transparent;">Dr. FeelSense IA</div>
                                    <div style="font-size:12px; color:#94a3b8;">Analista do Sistema | CRM: FSE-${now.getFullYear()}</div>`;
    
    // Mostrar relatório
    relatorioContainer.style.display = 'block';
    relatorioContainer.scrollIntoView({ behavior: 'smooth' });
    
    // Animação
    relatorioContainer.style.animation = 'none';
    setTimeout(() => { relatorioContainer.style.animation = 'slideUp 0.5s ease'; }, 10);
}

// ============ EXPORTAR DADOS (CSV) PARA O TCC ============
function exportToCSV() {
    if (emotionHistory.length === 0) {
        alert("Nenhum dado para exportar. Inicie a análise primeiro.");
        return;
    }
    
    let csvContent = "timestamp,angry,disgust,fear,happy,sad,surprise,neutral,confianca,emocao_dominante\n";
    
    emotionHistory.forEach(entry => {
        const row = [
            entry.timestamp,
            entry.angry || 0,
            entry.disgust || 0,
            entry.fear || 0,
            entry.happy || 0,
            entry.sad || 0,
            entry.surprise || 0,
            entry.neutral || 0,
            entry.confianca || 0,
            entry.emocao_dominante || ''
        ].join(',');
        csvContent += row + "\n";
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `feelsense_dados_${new Date().toISOString().slice(0,19)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    alert("✅ Dados exportados com sucesso para CSV!");
}

// ============ EVENT LISTENERS ============
endAnalysisBtn.addEventListener('click', generateRelatorio);
startBtn.addEventListener('click', startWebcam);
stopBtn.addEventListener('click', stopAnalysis);
printRelatorioBtn.addEventListener('click', () => window.print());

// Botão extra para exportar CSV (adicione no HTML se quiser)
// Se quiser, adicione um botão no dashboard com id="export-btn"

// ============ INICIALIZAÇÃO ============
window.addEventListener('load', () => {
    createParticles();
    
    // Carrega modelos automaticamente ao iniciar a página
    loadFaceApiModels();
    
    // Pergunta o nome para o relatório
    setTimeout(() => {
        let nome = prompt("Nome do participante para o relatório:", "Participante");
        if (nome && nome.trim()) {
            relatorioPessoa.textContent = nome.trim();
        } else {
            relatorioPessoa.textContent = "Não informado";
        }
    }, 500);
    
    console.log('🚀 FeelSense Dashboard carregado! Face-api.js integrado.');
});

// ============ FUNÇÃO PARA TESTE (MODO SIMULAÇÃO) ============
// Útil para apresentação do TCC sem webcam
function enableSimulationMode() {
    console.warn('⚠️ Modo simulação ativado - apenas para demonstração!');
    // Substitui a detecção real por simulação
    if (detectionInterval) clearInterval(detectionInterval);
    detectionInterval = setInterval(() => {
        const fakeExpressions = {
            angry: Math.random() * 0.3,
            disgust: Math.random() * 0.2,
            fear: Math.random() * 0.3,
            happy: Math.random() * 0.8,
            sad: Math.random() * 0.3,
            surprise: Math.random() * 0.4,
            neutral: Math.random() * 0.5
        };
        // Normaliza
        const total = Object.values(fakeExpressions).reduce((a,b) => a + b, 0);
        Object.keys(fakeExpressions).forEach(k => fakeExpressions[k] = fakeExpressions[k] / total);
        
        const dominant = Object.entries(fakeExpressions).reduce((a,b) => a[1] > b[1] ? a : b);
        emotionResult.innerHTML = `<i class="fas fa-flask"></i> [SIMULAÇÃO] ${emotionTranslations[dominant[0]]}`;
        kpiDominant.innerText = emotionTranslations[dominant[0]];
        emotionHistory.push({...fakeExpressions, timestamp: new Date(), confianca: dominant[1]});
        kpiSamples.innerText = emotionHistory.length;
        updateChart(fakeExpressions);
        updateEngagement(fakeExpressions);
    }, 2000);
}

// Descomente a linha abaixo para ativar modo simulação (útil para testes)
// setTimeout(enableSimulationMode, 1000);