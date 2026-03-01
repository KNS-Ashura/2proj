require('dotenv').config({ path: '../../.env' });
const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');


const http = require('http');



const { Server } = require('socket.io');


const lobbyRoutes = require('../Game_js/Online/Routes/lobbyRoutes');
const lobbySocket = require('../Game_js/Online/Sockets/lobbySocket');

const app = express();


const server = http.createServer(app);


app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: 5432,
});

// Test de connexion immédiat au lancement
pool.connect((err) => {
    if (err) console.error('Erreur de connexion DB', err.stack);
    else console.log('Connecté à la base de données RTS');
});


app.use('/api/lobby', lobbyRoutes(pool));

app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const hash = await bcrypt.hash(password, 10);

        const query = 'INSERT INTO players (username, email, password_hash) VALUES ($1, $2, $3) RETURNING user_id, username';
        const values = [username, email, hash];

        const result = await pool.query(query, values);
        res.status(201).json({ success: true, userId: result.rows[0].user_id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur lors de la création du compte." });
    }
});


app.post('/login', async (req, res) => {
    const { identifier, password } = req.body;

    try {
        // cherche dans la bdd l'email ou le username
        const userSearch = await pool.query(
            'SELECT * FROM players WHERE email = $1 OR username = $1',
            [identifier]
        );
        const user = userSearch.rows[0];

        if (!user) return res.status(401).json({ error: "Utilisateur non trouvé" });

        //check mdp
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(401).json({ error: "Mot de passe incorrect" });

        // generation du token
        const token = jwt.sign(
            { id: user.user_id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token, username: user.username });
    } catch (err) {
        res.status(500).send("Erreur serveur");
    }
});


const init_socket = new Server(server, {
    cors: {
        origin: 'http://localhost:5173'
    }
});


lobbySocket(init_socket, pool);


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});
