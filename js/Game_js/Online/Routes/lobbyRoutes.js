const express = require('express');
const crypto = require('crypto');

module.exports = function (pool, io) {
    const router = express.Router();

    // ROUTE 1 — POST /create
    
    // creer un lobby
    router.post('/create', async (req, res) => {
        const { user_id } = req.body;

        try {
            // Générer un code unique de 6 caractères (hex uppercase) exemple : A1G2G6
            const join_code = crypto.randomBytes(3).toString('hex').toUpperCase();

            // Insérer la partie dans la table games
            const gameResult = await pool.query(
                'INSERT INTO games (status, host_id, join_code) VALUES ($1, $2, $3) RETURNING id, join_code',
                ['WAITING', user_id, join_code]
            );

            const game_id = gameResult.rows[0].id;

            //  Inscrire le host comme slot 1 DANS LA TABLE match_participants
            await pool.query(
                'INSERT INTO match_participants (game_id, user_id, player_slot) VALUES ($1, $2, $3)',
                [game_id, user_id, 1]
            );

            // return une reponse si ca fonctionne
            res.status(201).json({ game_id, join_code });

        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Erreur lors de la création du lobby' });
        }
    });

   
    //  ROUTE 2 — POST /join

    //rejoindre le lobby avec le code
    router.post('/join', async (req, res) => {
        const { user_id, join_code } = req.body;

        try {
            // Vérifier que la partie existe
            
            const gameResult = await pool.query(
                'SELECT id, status FROM games WHERE join_code = $1 AND status = $2',
                [join_code, 'WAITING']
            );
            if (gameResult.rows.length === 0) {
                return res.status(404).json({ error: 'Lobby introuvable' });
            }

           
            const game = gameResult.rows[0];
            const game_id = game.id;

            //vérifier que le lobby n'est pas plein
            const nbr_participants = await pool.query(
                'SELECT COUNT(*) FROM match_participants WHERE game_id = $1',
                [game_id]
            );

            const playerCount = parseInt(nbr_participants.rows[0].count);
            if (playerCount >= 8) {
                return res.status(400).json({ error: 'Lobby plein' });
            }

            
            // trouver le slot disponible le plus bas (1 à 8)
            const slot_result = await pool.query(
                'SELECT player_slot FROM match_participants WHERE game_id = $1',
                [game_id]
            );

            //recup les slots deja pris
            const taken_slots = slot_result.rows.map(r => r.player_slot);
            let next_slot = null;
            for (let i = 1; i <= 8; i++) {
                if (!taken_slots.includes(i)) {
                    next_slot = i;
                    break;
                }
            } 


            //inserer le jouerur dans le lobby 
            const add_player = await pool.query(
                'INSERT INTO match_participants (game_id, user_id, player_slot) VALUES ($1, $2, $3)',
                [game_id, user_id, next_slot]
            );
            
            // Notifier tous les joueurs du lobby via socket
            if (io) {
                io.to(join_code).emit('lobby-updated', { game_id });
            }
            
            // Confirmer la jointure au client
            res.status(200).json({ game_id, player_slot: next_slot });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Erreur lors de la jointure au lobby' });
        }
    });

    
    //  ROUTE 3 — GET /:code

    // Récupère la liste des joueurs d'un lobby à partir de son code
    router.get('/:code', async (req, res) => {
        
        // Le /:code dans la route rend code accessible via req.params.code
        const code = req.params.code;

        try {
            // check si la partie existe et récupérer les joueurs
            const player_slot_result = await pool.query(
            `SELECT match_participants.player_slot, users.username
            FROM match_participants
            JOIN users ON match_participants.user_id = users.id
            JOIN games ON match_participants.game_id = games.id
            WHERE games.join_code = $1`,
                [code]
            );
            //si pas de partie trouvée → 404
            if (player_slot_result.rows.length === 0) {
                return res.status(404).json({ error: 'Lobby introuvable' });
            }
            //retourne les joueurs et leurs slots
            console.log(player_slot_result.rows);

            
            res.status(200).json({ players: player_slot_result.rows })  

        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Erreur lors de la récupération du lobby' });
        }
    });

    
    //  ROUTE 4 — POST /:code/start
   
    router.post('/:code/start', async (req, res) => {
        const code = req.params.code;
        const { user_id } = req.body;

        try {
            //check que la partie existe et récupérer son id + host_id
            const gameResult = await pool.query(
                'SELECT * FROM games WHERE join_code = $1',
                [code]
            );
            if (gameResult.rows.length === 0) {
                return res.status(404).json({ error: 'Lobby introuvable' });
            }
            const game = gameResult.rows[0];

            //check que user_id de celui qui lance soit le host (game.host_id)
            if (game.host_id != user_id) {
                return res.status(403).json({ error: 'Seul le host peut lancer la partie' });
            }
            //check que la partie a au moins 2 joueurs
                const nbr_participants = await pool.query(
                'SELECT COUNT(*) FROM match_participants WHERE game_id = $1',
                [game.id]
            );

            const playerCount = parseInt(nbr_participants.rows[0].count);
            if (playerCount < 2) {
                return res.status(400).json({ error: 'Il faut au moins 2 joueurs' });
            }
            //mettre a jour de statut de la partie
            await pool.query(
                'UPDATE games SET status = $1, started_at = NOW() WHERE id = $2',
                ['IN_PROGRESS', game.id]
            );
            //notif les joueurs via socket que la partie commence
            if (io) {
                io.to(code).emit('game-start', { game_id: game.id });
            }
     
            res.status(200).json({ message: 'Partie lancée' });

        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Erreur lors du lancement de la partie' });
        }
    });

    
    //  ROUTE 5 — DELETE /:code/leave
    
    router.delete('/:code/leave', async (req, res) => {
        const code = req.params.code;
        const { user_id } = req.body;

        try {
            
                const gameResult = await pool.query(
                'SELECT id FROM games WHERE join_code = $1',
                [code]
            );

            if (gameResult.rows.length === 0) {
                return res.status(404).json({ error: 'Lobby introuvable' });
            }
            const game_id = gameResult.rows[0].id;
            
            await pool.query(
                'DELETE FROM match_participants WHERE game_id = $1 AND user_id = $2',
                [game_id, user_id]
            );
           
            res.status(200).json({ message: 'Vous avez quitté le lobby' })

        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Erreur lors du départ du lobby' });
        }
    });

    return router;
};
