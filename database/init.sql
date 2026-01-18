-- ============================================================
-- 1. INITIALISATION
-- ============================================================
-- On nettoie le schéma public pour repartir de zéro (Attention en prod !)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- Extension nécessaire pour générer des UUIDs automatiques
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 2. DÉFINITION DES TYPES (ENUMS)
-- ============================================================
CREATE TYPE unit_category AS ENUM ('GROUND', 'WATER');
CREATE TYPE camp_type AS ENUM ('STANDARD', 'PORT', 'NEUTRAL');
CREATE TYPE game_status AS ENUM ('WAITING', 'IN_PROGRESS', 'FINISHED', 'CANCELLED');
CREATE TYPE match_result AS ENUM ('WIN', 'LOSS');
CREATE TYPE ai_difficulty AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- ============================================================
-- 3. TABLES "IDENTITÉ" & "CONFIG"
-- ============================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    elo_rating INT DEFAULT 1200,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE units_templates (
    id SERIAL PRIMARY KEY,
    key_name VARCHAR(50) UNIQUE NOT NULL, -- ex: 'archer'
    category unit_category NOT NULL,      -- 'GROUND' ou 'WATER'
    
    -- Stats de combat
    hp INT NOT NULL,
    damage INT NOT NULL,
    range INT NOT NULL,
    attack_speed INT NOT NULL,            -- Temps en ms entre deux attaques (ex: 1500)
    
    -- Stats économie/mouvement
    move_speed FLOAT NOT NULL,
    cost INT NOT NULL,
    build_time INT NOT NULL               -- En millisecondes
);

CREATE TABLE map (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    layout_data JSONB NOT NULL,           -- La grille [[0,1]...]
    max_players INT DEFAULT 4,
    is_active BOOLEAN DEFAULT TRUE        -- Soft delete pour maps buggées
);

CREATE TABLE region (
    id SERIAL PRIMARY KEY,
    map_id INT REFERENCES map(id) ON DELETE CASCADE,
    name VARCHAR(100),
    bonus_gold INT DEFAULT 10,
    region_coord JSONB NOT NULL           -- Coordonnées du polygone de la zone
);

CREATE TABLE camps (
    id SERIAL PRIMARY KEY,
    map_id INT REFERENCES map(id) ON DELETE CASCADE,
    region_id INT REFERENCES region(id) ON DELETE SET NULL, -- Peut être NULL si hors zone
    
    x INT NOT NULL,
    y INT NOT NULL,
    type camp_type DEFAULT 'STANDARD',
    
    base_hp INT DEFAULT 1000,
    turret_damage INT DEFAULT 10
);

-- ============================================================
-- 4. TABLES "SESSION DE JEU" (DYNAMIQUES)
-- ============================================================

CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    map_id INT REFERENCES map(id),
    host_id UUID REFERENCES users(id),
    
    status game_status DEFAULT 'WAITING',
    
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    winner_id UUID REFERENCES users(id)   -- Rempli à la fin
);

CREATE TABLE match_participants (
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),    -- NULL si IA
    
    player_slot INT NOT NULL,             -- 1 à 8 (Position de départ)
    team_color VARCHAR(10) DEFAULT '#FFFFFF',
    
    -- Gestion IA
    is_ai BOOLEAN DEFAULT FALSE,
    ai_difficulty ai_difficulty,          -- NULL si humain
    
    -- Gestion Connexion
    is_connected BOOLEAN DEFAULT TRUE,    -- False si déconnecté (unités inactives)
    has_surrendered BOOLEAN DEFAULT FALSE,
    
    -- Clé primaire composite : un joueur ne peut avoir qu'un slot par game
    PRIMARY KEY (game_id, player_slot)
);

CREATE TABLE history (
    id BIGSERIAL PRIMARY KEY,
    game_id UUID REFERENCES games(id),
    user_id UUID REFERENCES users(id),
    
    result match_result NOT NULL,
    
    units_produced INT DEFAULT 0,
    units_lost INT DEFAULT 0,
    camps_captured INT DEFAULT 0,
    gold_earned INT DEFAULT 0,
    elo_change INT DEFAULT 0
);