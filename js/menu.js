/* menu.js - controla o menu hambúrguer e comportamento mobile */
document.addEventListener('DOMContentLoaded', function () {
    const toggle = document.getElementById('menuToggle');
    const nav = document.querySelector('.nav-links');

    if (!toggle || !nav) return;

    toggle.addEventListener('click', function (e) {
        e.stopPropagation();
        nav.classList.toggle('open');
        toggle.classList.toggle('open');
    });

    // Fechar ao clicar em um link
    nav.addEventListener('click', function (e) {
        if (e.target.tagName === 'A') {
            nav.classList.remove('open');
            toggle.classList.remove('open');
        }
    });

    // Fechar ao clicar fora
    document.addEventListener('click', function (e) {
        if (!nav.contains(e.target) && !toggle.contains(e.target)) {
            nav.classList.remove('open');
            toggle.classList.remove('open');
        }
    });
});
