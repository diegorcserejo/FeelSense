// solucoes.js - Animações da página de soluções

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

// Animação de entrada dos cards
function animateCardsOnScroll() {
    const cards = document.querySelectorAll('.solucao-card, .case-card');
    
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

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    createParticles();
    animateCardsOnScroll();
    setupNavbar();
    console.log('🚀 Página de Soluções carregada!');
});