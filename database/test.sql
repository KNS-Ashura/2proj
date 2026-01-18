-- -- ============================================================
-- -- SCRIPT DE SEED (DONNÉES INITIALES)
-- -- ============================================================

-- -- 1. Créer 2 utilisateurs de test (Mots de passe non hachés pour l'exemple)
-- INSERT INTO users (username, email, password_hash, elo_rating) VALUES
-- ('PlayerOne', 'p1@test.com', 'hash_secret_123', 1200),
-- ('PlayerTwo', 'p2@test.com', 'hash_secret_456', 1150);

-- -- 2. Configurer les Unités (1 Terrestre, 1 Navale pour tester)
-- INSERT INTO units_templates (key_name, category, hp, damage, range, attack_speed, move_speed, cost, build_time) VALUES
-- ('archer', 'GROUND', 80, 15, 4, 1500, 2.5, 75, 5000), -- Tir toutes les 1.5s
-- ('frigate', 'WATER', 250, 40, 6, 2000, 3.0, 200, 15000); -- Bateau puissant

-- -- 3. Créer la Map "Level 1" (Ton tableau JSON)
-- INSERT INTO map (name, max_players, is_active, layout_data) VALUES
-- ('The Crossing', 2, TRUE, 
--  '[
--     [1,1,1,1,1,1,1,1],
--     [1,1,1,1,1,1,1,1],
--     [0,0,1,1,1,1,1,1],
--     [0,0,0,0,0,2,2,0], 
--     [0,0,0,0,0,2,2,0],
--     [0,0,0,0,0,2,2,0],
--     [0,0,0,0,0,2,2,0],
--     [0,0,0,0,0,2,2,0]
--  ]'::jsonb
-- );

-- -- 4. Définir une Région (ex: "La Forêt Sud")
-- -- On suppose que la map insérée a l'ID 1.
-- INSERT INTO region (map_id, name, bonus_gold, region_coord) VALUES
-- (1, 'South Forest', 5, '[{"x": 5, "y": 3}, {"x": 7, "y": 7}]'::jsonb);

-- -- 5. Placer des Camps
-- -- Un camp STANDARD sur l''herbe (0)
-- INSERT INTO camps (map_id, region_id, x, y, type, base_hp) VALUES
-- (1, 1, 6, 6, 'STANDARD', 1000); -- Dans la région forêt

-- -- Un camp PORT près de l''eau
-- INSERT INTO camps (map_id, region_id, x, y, type, base_hp) VALUES
-- (1, NULL, 2, 2, 'PORT', 1200); -- Hors région