export function initLogin() {
    const bubble = document.getElementById('login-bubble');

    // Toggle bubble
    document.getElementById('login-btn').addEventListener('click', () => {
        document.getElementById('register-bubble').classList.add('hidden');
        bubble.classList.toggle('hidden');
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
        if (!bubble.classList.contains('hidden') &&
            !bubble.contains(e.target) &&
            !e.target.closest('#login-btn')) {
            bubble.classList.add('hidden');
        }
    });
}
