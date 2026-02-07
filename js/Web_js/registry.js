export function initRegister() {
    const bubble = document.getElementById('register-bubble');

    // Toggle bubble
    document.getElementById('register-btn').addEventListener('click', () => {
        document.getElementById('login-bubble').classList.add('hidden');
        bubble.classList.toggle('hidden');
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
        if (!bubble.classList.contains('hidden') &&
            !bubble.contains(e.target) &&
            !e.target.closest('#register-btn')) {
            bubble.classList.add('hidden');
        }
    });
}
