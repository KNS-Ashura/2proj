const API = 'http://localhost:3000';

export function initLogin() {
    const bubble = document.getElementById('login-bubble');
    const form = document.getElementById('login-form');
    const globalError = document.getElementById('login-global-error');

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

    // submit form
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        globalError.classList.add('hidden');

        const identifier = document.getElementById('login-identifier').value.trim();
        const password = document.getElementById('login-password').value;

        try {
            const res = await fetch(API + '/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier, password })
            });
            const data = await res.json();

            if (!res.ok) {
                globalError.textContent = data.error;
                globalError.classList.remove('hidden');
                return;
            }

            // stocker pour le localstorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', data.username);

            //upatde front
            showLoggedIn(data.username);
            bubble.classList.add('hidden');
        } catch {
            globalError.textContent = 'Impossible de contacter le serveur.';
            globalError.classList.remove('hidden');
        }
    });
}

export function showLoggedIn(username) {
    document.getElementById('auth-buttons').classList.add('hidden');
    const profile = document.getElementById('auth-profile');
    profile.classList.remove('hidden');
    profile.querySelector('span').textContent = username;
}

// Restaurer la session au chargement
export function restoreSession() {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    if (token && username) {
        showLoggedIn(username);
    }
}
