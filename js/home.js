// home.js - Efeitos e animações da página inicial

// Partículas animadas
function createParticles() {
    const container = document.getElementById('particles');
    const particleCount = 80;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        particle.style.cssText = `
            position: absolute;
            width: ${Math.random() * 3 + 1}px;
            height: ${Math.random() * 3 + 1}px;
            background: ${Math.random() > 0.7 ? '#8b5cf6' : '#6366f1'};
            border-radius: 50%;
            top: ${Math.random() * 100}%;
            left: ${Math.random() * 100}%;
            opacity: ${Math.random() * 0.3 + 0.1};
            animation: floatParticle ${Math.random() * 10 + 10}s linear infinite;
            animation-delay: ${Math.random() * 5}s;
        `;
        container.appendChild(particle);
    }
}

// Animação de partículas
const style = document.createElement('style');
style.textContent = `
    @keyframes floatParticle {
        0% {
            transform: translateY(0) translateX(0);
            opacity: 0;
        }
        10% {
            opacity: ${Math.random() * 0.5 + 0.2};
        }
        90% {
            opacity: ${Math.random() * 0.5 + 0.2};
        }
        100% {
            transform: translateY(-100vh) translateX(${Math.random() * 100 - 50}px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Animação dos números (counter)
function animateNumbers() {
    const statNumbers = document.querySelectorAll('.stat-number');
    
    statNumbers.forEach(stat => {
        const target = parseInt(stat.getAttribute('data-target'));
        let current = 0;
        const increment = target / 60;
        const updateNumber = () => {
            if (current < target) {
                current += increment;
                stat.textContent = Math.floor(current);
                requestAnimationFrame(updateNumber);
            } else {
                stat.textContent = target;
            }
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    updateNumber();
                    observer.disconnect();
                }
            });
        });
        observer.observe(stat);
    });
}

// Animação de entrada dos cards (scroll reveal)
function revealOnScroll() {
    const cards = document.querySelectorAll('.feature-card, .step');
    
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
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'all 0.6s ease';
        observer.observe(card);
    });
}

// Efeito de hover nos emotion chips
function setupEmotionChips() {
    const chips = document.querySelectorAll('.emotion-chip');
    
    chips.forEach(chip => {
        chip.addEventListener('mouseenter', () => {
            chip.style.transform = 'scale(1.1)';
            chip.style.boxShadow = `0 0 15px ${chip.style.getPropertyValue('--emoji-color') || '#8b5cf6'}`;
        });
        
        chip.addEventListener('mouseleave', () => {
            chip.style.transform = 'scale(1)';
            chip.style.boxShadow = 'none';
        });
        
        chip.addEventListener('click', () => {
            const emotion = chip.getAttribute('data-emotion');
            console.log(`Emoção selecionada: ${emotion}`);
            // Feedback visual
            chip.style.animation = 'pulse 0.3s ease';
            setTimeout(() => {
                chip.style.animation = '';
            }, 300);
        });
    });
}

// Pulse animation
const pulseStyle = document.createElement('style');
pulseStyle.textContent = `
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.2); }
    }
`;
document.head.appendChild(pulseStyle);

// Navbar scroll effect
function setupNavbar() {
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(10, 15, 28, 0.95)';
            navbar.style.backdropFilter = 'blur(12px)';
        } else {
            navbar.style.background = 'rgba(10, 15, 28, 0.8)';
        }
    });
}

// Redirecionamento para o dashboard
function setupNavigation() {
    const startButtons = document.querySelectorAll('#heroStartBtn, #startNowBtn, #ctaStartBtn');
    const demoBtn = document.getElementById('demoBtn');
    
    startButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            window.location.href = 'dashboard.html';
        });
    });
    
    if (demoBtn) {
        demoBtn.addEventListener('click', () => {
            alert('🎥 Demonstração: O FeelSense analisa expressões faciais em tempo real com precisão de 98%!');
        });
    }
}

// Efeito de mouse tracking no hero sphere
function setupMouseTracking() {
    const sphere = document.querySelector('.hero-sphere');
    const heroVisual = document.querySelector('.hero-visual');
    
    if (sphere && heroVisual) {
        heroVisual.addEventListener('mousemove', (e) => {
            const rect = heroVisual.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width - 0.5) * 40;
            const y = ((e.clientY - rect.top) / rect.height - 0.5) * 40;
            sphere.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(1.1)`;
        });
        
        heroVisual.addEventListener('mouseleave', () => {
            sphere.style.transform = 'translate(-50%, -50%) scale(1)';
        });
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    createParticles();
    animateNumbers();
    revealOnScroll();
    setupEmotionChips();
    setupNavbar();
    setupNavigation();
    setupMouseTracking();
    
    // Adiciona classe de animação aos cards flutuantes
    const floatingCards = document.querySelectorAll('.floating-card');
    floatingCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.5}s`;
    });
    
    // Efeito de digitação no título (opcional)
    const title = document.querySelector('.hero-title');
    if (title) {
        title.style.opacity = '1';
    }
    
    console.log('🚀 FeelSense Home carregada com sucesso!');
});