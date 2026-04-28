// contato.js - Lógica da página de contato

// Criar partículas
function createParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    
    for (let i = 0; i < 60; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        particle.style.cssText = `
            width: ${Math.random() * 4 + 1}px;
            height: ${Math.random() * 4 + 1}px;
            top: ${Math.random() * 100}%;
            left: ${Math.random() * 100}%;
            animation-duration: ${Math.random() * 8 + 5}s;
            animation-delay: ${Math.random() * 5}s;
        `;
        container.appendChild(particle);
    }
}

// Navbar scroll effect
function setupNavbar() {
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(10, 15, 28, 0.95)';
        } else {
            navbar.style.background = 'rgba(10, 15, 28, 0.8)';
        }
    });
}

// Envio do formulário
function setupFormSubmit() {
    const form = document.getElementById('contactForm');
    const submitBtn = document.getElementById('submitBtn');
    const formMessage = document.getElementById('formMessage');
    
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Pegar dados
        const nome = document.getElementById('nome').value;
        const email = document.getElementById('email').value;
        const telefone = document.getElementById('telefone').value;
        const mensagem = document.getElementById('mensagem').value;
        
        // Validação básica
        if (!nome || !email || !mensagem) {
            showMessage('Por favor, preencha todos os campos obrigatórios.', 'error');
            return;
        }
        
        if (!email.includes('@')) {
            showMessage('Por favor, insira um e-mail válido.', 'error');
            return;
        }
        
        // Simular envio (aqui você pode conectar com uma API real)
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
        
        // Simular delay de API
        setTimeout(() => {
            // Log dos dados
            console.log('Dados do formulário:', { nome, email, telefone, mensagem });
            
            // Mostrar sucesso
            showMessage('Mensagem enviada com sucesso! Entraremos em contato em breve.', 'success');
            
            // Limpar formulário
            form.reset();
            
            // Resetar botão
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar mensagem';
            
            // Limpar mensagem após 5 segundos
            setTimeout(() => {
                formMessage.style.display = 'none';
            }, 5000);
        }, 1500);
    });
}

function showMessage(msg, type) {
    const formMessage = document.getElementById('formMessage');
    formMessage.textContent = msg;
    formMessage.className = `form-message ${type}`;
    formMessage.style.display = 'block';
    
    // Scroll para a mensagem
    formMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Animar cards na entrada
function animateInfoCards() {
    const cards = document.querySelectorAll('.info-card');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    
    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'all 0.5s ease';
        observer.observe(card);
    });
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    createParticles();
    setupNavbar();
    setupFormSubmit();
    animateInfoCards();
    console.log('📞 Página de Contato carregada!');
});