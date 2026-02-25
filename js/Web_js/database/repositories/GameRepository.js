/**
 * SupKonQuest - Game Repository
 * Database operations for game sessions and real-time state
 */

import db from '../config.js';

// ============================================================
// GAME SESSION OPERATIONS
// ============================================================

/**
 * Create a new game
 * @param {Object} gameData
 * @returns {Promise<Object>}
 */
export async function createGame({
    hostUserId,
    mapTemplateId,
    name,
    maxPlayers = 2,
    gameSpeed = 1.0,
    startingMoney = 100,
    moneyInterval = 30
}) {
    const result = await db.query(
        `INSERT INTO games (
            host_user_id, map_template_id, name, max_players,
            game_speed, starting_money, money_interval, status
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'waiting')
         RETURNING *`,
        [hostUserId, mapTemplateId, name, maxPlayers, gameSpeed, startingMoney, moneyInterval]
    );

    return result.rows[0];
}

/**
 * Get game by ID with full details
 * @param {string} gameId
 * @returns {Promise<Object|null>}
 */
export async function findById(gameId) {
    const result = await db.query(
        `SELECT g.*,
                mt.name AS map_name,
                mt.width AS map_width,
                mt.height AS map_height,
                u.username AS host_username
         FROM games g
         JOIN map_templates mt ON g.map_template_id = mt.id
         JOIN users u ON g.host_user_id = u.id
         WHERE g.id = $1`,
        [gameId]
    );

    return result.rows[0] || null;
}

/**
 * Get active games for lobby browser
 * @param {number} limit
 * @returns {Promise<Array>}
 */
export async function getActiveGames(limit = 50) {
    const result = await db.query(
        `SELECT g.id, g.name, g.max_players, g.status, g.created_at,
                mt.name AS map_name,
                u.username AS host_username,
                COUNT(gp.id) AS current_players
         FROM games g
         JOIN map_templates mt ON g.map_template_id = mt.id
         JOIN users u ON g.host_user_id = u.id
         LEFT JOIN game_players gp ON g.id = gp.game_id AND gp.status = 'active'
         WHERE g.status IN ('waiting', 'in_progress')
         GROUP BY g.id, mt.name, u.username
         ORDER BY g.created_at DESC
         LIMIT $1`,
        [limit]
    );

    return result.rows;
}

/**
 * Update game status
 * @param {string} gameId
 * @param {string} status
 */
export async function updateStatus(gameId, status) {
    const updates = { status };

    if (status === 'in_progress') {
        updates.started_at = 'CURRENT_TIMESTAMP';
    } else if (status === 'finished' || status === 'abandoned') {
        updates.ended_at = 'CURRENT_TIMESTAMP';
    }

    await db.query(
        `UPDATE games
         SET status = $2,
             started_at = CASE WHEN $2 = 'in_progress' THEN CURRENT_TIMESTAMP ELSE started_at END,
             ended_at = CASE WHEN $2 IN ('finished', 'abandoned') THEN CURRENT_TIMESTAMP ELSE ended_at END
         WHERE id = $1`,
        [gameId, status]
    );
}

/**
 * Set game winner
 * @param {string} gameId
 * @param {string} winnerId - User UUID
 */
export async function setWinner(gameId, winnerId) {
    await db.query(
        `UPDATE games
         SET winner_id = $2, status = 'finished', ended_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [gameId, winnerId]
    );
}

// ============================================================
// GAME PLAYERS OPERATIONS
// ============================================================

/**
 * Add player to game
 * @param {Object} playerData
 * @returns {Promise<Object>}
 */
export async function addPlayer({
    gameId,
    userId,
    playerNumber,
    displayName,
    color,
    isAi = false,
    aiDifficulty = null
}) {
    const result = await db.query(
        `INSERT INTO game_players (
            game_id, user_id, player_number, display_name, color, is_ai, ai_difficulty
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [gameId, userId, playerNumber, displayName, color, isAi, aiDifficulty]
    );

    return result.rows[0];
}

/**
 * Get all players in a game
 * @param {string} gameId
 * @returns {Promise<Array>}
 */
export async function getPlayers(gameId) {
    const result = await db.query(
        `SELECT gp.*,
                u.username,
                u.avatar_url,
                COUNT(gc.id) AS camps_count
         FROM game_players gp
         LEFT JOIN users u ON gp.user_id = u.id
         LEFT JOIN game_camps gc ON gp.id = gc.owner_id
         WHERE gp.game_id = $1
         GROUP BY gp.id, u.username, u.avatar_url
         ORDER BY gp.player_number`,
        [gameId]
    );

    return result.rows;
}

/**
 * Update player money
 * @param {string} playerId
 * @param {number} amount - Amount to add (can be negative)
 */
export async function updatePlayerMoney(playerId, amount) {
    await db.query(
        `UPDATE game_players
         SET money = GREATEST(0, money + $2)
         WHERE id = $1`,
        [playerId, amount]
    );
}

/**
 * Update player status
 * @param {string} playerId
 * @param {string} status
 */
export async function updatePlayerStatus(playerId, status) {
    const leftAt = ['surrendered', 'defeated', 'disconnected'].includes(status)
        ? 'CURRENT_TIMESTAMP'
        : null;

    await db.query(
        `UPDATE game_players
         SET status = $2,
             left_at = CASE WHEN $2 IN ('surrendered', 'defeated', 'disconnected')
                           THEN CURRENT_TIMESTAMP ELSE left_at END
         WHERE id = $1`,
        [playerId, status]
    );
}

/**
 * Increment player statistics
 * @param {string} playerId
 * @param {Object} stats
 */
export async function incrementPlayerStats(playerId, { unitsKilled = 0, unitsLost = 0, campsCaptured = 0, campsLost = 0 }) {
    await db.query(
        `UPDATE game_players
         SET units_killed = units_killed + $2,
             units_lost = units_lost + $3,
             camps_captured = camps_captured + $4,
             camps_lost = camps_lost + $5
         WHERE id = $1`,
        [playerId, unitsKilled, unitsLost, campsCaptured, campsLost]
    );
}

// ============================================================
// REAL-TIME GAME STATE QUERIES
// ============================================================

/**
 * Get complete game state for synchronization
 * @param {string} gameId
 * @returns {Promise<Object>}
 */
export async function getGameState(gameId) {
    const [game, players, camps, units, ships, regionControl] = await Promise.all([
        findById(gameId),
        getPlayers(gameId),
        getCamps(gameId),
        getUnits(gameId),
        getShips(gameId),
        getRegionControl(gameId)
    ]);

    return {
        game,
        players,
        camps,
        units,
        ships,
        regionControl
    };
}

/**
 * Get all camps in a game
 * @param {string} gameId
 * @returns {Promise<Array>}
 */
export async function getCamps(gameId) {
    const result = await db.query(
        `SELECT gc.*,
                gp.player_number AS owner_player_number,
                gp.color AS owner_color
         FROM game_camps gc
         LEFT JOIN game_players gp ON gc.owner_id = gp.id
         WHERE gc.game_id = $1`,
        [gameId]
    );

    return result.rows;
}

/**
 * Get all living units in a game
 * @param {string} gameId
 * @returns {Promise<Array>}
 */
export async function getUnits(gameId) {
    const result = await db.query(
        `SELECT gu.*,
                ut.name AS unit_name,
                ut.unit_type,
                ut.base_hp,
                ut.base_damage,
                ut.hit_speed,
                ut.range,
                ut.walk_speed,
                gp.player_number AS owner_player_number,
                gp.color AS owner_color
         FROM game_units gu
         JOIN unit_templates ut ON gu.unit_template_id = ut.id
         JOIN game_players gp ON gu.owner_id = gp.id
         WHERE gu.game_id = $1 AND gu.is_alive = TRUE`,
        [gameId]
    );

    return result.rows;
}

/**
 * Get all living ships in a game
 * @param {string} gameId
 * @returns {Promise<Array>}
 */
export async function getShips(gameId) {
    const result = await db.query(
        `SELECT gs.*,
                st.name AS ship_name,
                st.ship_type,
                st.base_hp,
                st.base_damage,
                st.cargo_capacity,
                gp.player_number AS owner_player_number,
                gp.color AS owner_color
         FROM game_ships gs
         JOIN ship_templates st ON gs.ship_template_id = st.id
         JOIN game_players gp ON gs.owner_id = gp.id
         WHERE gs.game_id = $1 AND gs.is_alive = TRUE`,
        [gameId]
    );

    return result.rows;
}

/**
 * Get region control status
 * @param {string} gameId
 * @returns {Promise<Array>}
 */
export async function getRegionControl(gameId) {
    const result = await db.query(
        `SELECT grc.*,
                mr.name AS region_name,
                mr.color AS region_color,
                mr.money_bonus,
                gp.player_number AS owner_player_number
         FROM game_region_control grc
         JOIN map_regions mr ON grc.region_id = mr.id
         LEFT JOIN game_players gp ON grc.owner_id = gp.id
         WHERE grc.game_id = $1`,
        [gameId]
    );

    return result.rows;
}

// ============================================================
// CAMP OPERATIONS
// ============================================================

/**
 * Create a camp in game
 * @param {Object} campData
 * @returns {Promise<Object>}
 */
export async function createCamp({
    gameId,
    ownerId,
    tileX,
    tileY,
    campType,
    regionId,
    maxHp,
    turretDamage = 10,
    turretRange = 3
}) {
    const result = await db.query(
        `INSERT INTO game_camps (
            game_id, owner_id, tile_x, tile_y, camp_type, region_id,
            current_hp, max_hp, turret_damage, turret_range
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $7, $8, $9)
         RETURNING *`,
        [gameId, ownerId, tileX, tileY, campType, regionId, maxHp, turretDamage, turretRange]
    );

    return result.rows[0];
}

/**
 * Update camp owner (capture)
 * @param {string} campId
 * @param {string} newOwnerId
 */
export async function updateCampOwner(campId, newOwnerId) {
    await db.query(
        `UPDATE game_camps
         SET owner_id = $2, captured_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [campId, newOwnerId]
    );
}

/**
 * Update camp HP
 * @param {string} campId
 * @param {number} damage
 */
export async function damageCamp(campId, damage) {
    await db.query(
        `UPDATE game_camps
         SET current_hp = GREATEST(0, current_hp - $2)
         WHERE id = $1`,
        [campId, damage]
    );
}

/**
 * Update production queue
 * @param {string} campId
 * @param {Array} queue
 */
export async function updateProductionQueue(campId, queue) {
    await db.query(
        `UPDATE game_camps SET production_queue = $2 WHERE id = $1`,
        [campId, JSON.stringify(queue)]
    );
}

// ============================================================
// UNIT OPERATIONS
// ============================================================

/**
 * Create a unit
 * @param {Object} unitData
 * @returns {Promise<Object>}
 */
export async function createUnit({
    gameId,
    ownerId,
    unitTemplateId,
    positionX,
    positionY,
    currentHp,
    sourceCampId
}) {
    const result = await db.query(
        `INSERT INTO game_units (
            game_id, owner_id, unit_template_id,
            position_x, position_y, current_hp, source_camp_id
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [gameId, ownerId, unitTemplateId, positionX, positionY, currentHp, sourceCampId]
    );

    return result.rows[0];
}

/**
 * Update unit position
 * @param {string} unitId
 * @param {number} x
 * @param {number} y
 */
export async function updateUnitPosition(unitId, x, y) {
    await db.query(
        `UPDATE game_units SET position_x = $2, position_y = $3 WHERE id = $1`,
        [unitId, x, y]
    );
}

/**
 * Update unit target position
 * @param {string} unitId
 * @param {number} targetX
 * @param {number} targetY
 */
export async function setUnitTarget(unitId, targetX, targetY) {
    await db.query(
        `UPDATE game_units SET target_x = $2, target_y = $3 WHERE id = $1`,
        [unitId, targetX, targetY]
    );
}

/**
 * Damage a unit
 * @param {string} unitId
 * @param {number} damage
 */
export async function damageUnit(unitId, damage) {
    const result = await db.query(
        `UPDATE game_units
         SET current_hp = GREATEST(0, current_hp - $2),
             is_alive = (current_hp - $2) > 0,
             died_at = CASE WHEN (current_hp - $2) <= 0 THEN CURRENT_TIMESTAMP ELSE died_at END
         WHERE id = $1
         RETURNING is_alive`,
        [unitId, damage]
    );

    return result.rows[0]?.is_alive ?? false;
}

/**
 * Assign unit to control group
 * @param {string} unitId
 * @param {number} groupNumber
 */
export async function setUnitGroup(unitId, groupNumber) {
    await db.query(
        `UPDATE game_units SET group_number = $2 WHERE id = $1`,
        [unitId, groupNumber]
    );
}

/**
 * Get units in control group
 * @param {string} ownerId
 * @param {number} groupNumber
 * @returns {Promise<Array>}
 */
export async function getUnitsByGroup(ownerId, groupNumber) {
    const result = await db.query(
        `SELECT gu.*, ut.name, ut.unit_type
         FROM game_units gu
         JOIN unit_templates ut ON gu.unit_template_id = ut.id
         WHERE gu.owner_id = $1 AND gu.group_number = $2 AND gu.is_alive = TRUE`,
        [ownerId, groupNumber]
    );

    return result.rows;
}

export default {
    // Game operations
    createGame,
    findById,
    getActiveGames,
    updateStatus,
    setWinner,

    // Player operations
    addPlayer,
    getPlayers,
    updatePlayerMoney,
    updatePlayerStatus,
    incrementPlayerStats,

    // State operations
    getGameState,
    getCamps,
    getUnits,
    getShips,
    getRegionControl,

    // Camp operations
    createCamp,
    updateCampOwner,
    damageCamp,
    updateProductionQueue,

    // Unit operations
    createUnit,
    updateUnitPosition,
    setUnitTarget,
    damageUnit,
    setUnitGroup,
    getUnitsByGroup
};
