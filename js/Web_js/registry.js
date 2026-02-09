const API = 'http://localhost:3000';

export function initRegister() {
    const bubble = document.getElementById('register-bubble');
    const form = document.getElementById('register-form');
    const globalError = document.getElementById('register-global-error');

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

    // submit form
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        globalError.classList.add('hidden');

        const username = document.getElementById('register-username').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;
        const confirm = document.getElementById('register-confirm').value;

        
        if (password !== confirm) {
            globalError.textContent = 'Les mots de passe ne correspondent pas.';
            globalError.classList.remove('hidden');
            return;
        }

        try {
            const res = await fetch(API + '/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });
            const data = await res.json();

            if (!res.ok) {
                globalError.textContent = data.error;
                globalError.classList.remove('hidden');
                return;
            }

            // Inscription OK → auto-login
            const loginRes = await fetch(API + '/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier: email, password })
            });
            const loginData = await loginRes.json();

            localStorage.setItem('token', loginData.token);
            localStorage.setItem('username', loginData.username);

            // Importer showLoggedIn depuis login.js
            const { showLoggedIn } = await import('./login.js');
            showLoggedIn(loginData.username);
            bubble.classList.add('hidden');
        } catch {
            globalError.textContent = 'Impossible de contacter le serveur.';
            globalError.classList.remove('hidden');
        }
    });
}
