/**
 * SupKonQuest - User Repository
 * Database operations for user management and authentication
 */

import db from '../config.js';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

/**
 * Create a new user
 * @param {Object} userData - User data
 * @returns {Promise<Object>} Created user (without password)
 */
export async function createUser({ username, email, password, displayName }) {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await db.query(
        `INSERT INTO users (username, email, password_hash, display_name)
         VALUES ($1, $2, $3, $4)
         RETURNING id, username, email, display_name, created_at`,
        [username, email, passwordHash, displayName || username]
    );

    return result.rows[0];
}

/**
 * Find user by ID
 * @param {string} id - User UUID
 * @returns {Promise<Object|null>}
 */
export async function findById(id) {
    const result = await db.query(
        `SELECT id, username, email, display_name, avatar_url,
                games_played, games_won, total_units_killed, total_camps_captured,
                is_active, is_verified, last_login, created_at
         FROM users
         WHERE id = $1`,
        [id]
    );

    return result.rows[0] || null;
}

/**
 * Find user by username
 * @param {string} username
 * @returns {Promise<Object|null>}
 */
export async function findByUsername(username) {
    const result = await db.query(
        `SELECT id, username, email, display_name, password_hash,
                is_active, is_verified
         FROM users
         WHERE username = $1`,
        [username]
    );

    return result.rows[0] || null;
}

/**
 * Find user by email
 * @param {string} email
 * @returns {Promise<Object|null>}
 */
export async function findByEmail(email) {
    const result = await db.query(
        `SELECT id, username, email, display_name, password_hash,
                is_active, is_verified
         FROM users
         WHERE email = $1`,
        [email]
    );

    return result.rows[0] || null;
}

/**
 * Authenticate user with password
 * @param {string} username
 * @param {string} password
 * @returns {Promise<Object|null>} User if authenticated, null otherwise
 */
export async function authenticate(username, password) {
    const user = await findByUsername(username);

    if (!user || !user.is_active) {
        return null;
    }

    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
        return null;
    }

    // Update last login
    await db.query(
        `UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1`,
        [user.id]
    );

    // Return user without password hash
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
}

/**
 * Update user profile
 * @param {string} id - User UUID
 * @param {Object} updates
 * @returns {Promise<Object>}
 */
export async function updateProfile(id, { displayName, avatarUrl }) {
    const result = await db.query(
        `UPDATE users
         SET display_name = COALESCE($2, display_name),
             avatar_url = COALESCE($3, avatar_url),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING id, username, email, display_name, avatar_url`,
        [id, displayName, avatarUrl]
    );

    return result.rows[0];
}

/**
 * Update user statistics after a game
 * @param {string} id - User UUID
 * @param {Object} stats
 */
export async function updateStats(id, { won, unitsKilled, campsCaptured }) {
    await db.query(
        `UPDATE users
         SET games_played = games_played + 1,
             games_won = games_won + $2,
             total_units_killed = total_units_killed + $3,
             total_camps_captured = total_camps_captured + $4,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [id, won ? 1 : 0, unitsKilled || 0, campsCaptured || 0]
    );
}

/**
 * Get leaderboard
 * @param {number} limit
 * @returns {Promise<Array>}
 */
export async function getLeaderboard(limit = 100) {
    const result = await db.query(
        `SELECT id, username, display_name, avatar_url,
                games_played, games_won,
                CASE WHEN games_played > 0
                    THEN ROUND((games_won::DECIMAL / games_played) * 100, 2)
                    ELSE 0
                END AS win_rate,
                total_units_killed, total_camps_captured
         FROM users
         WHERE is_active = TRUE AND games_played > 0
         ORDER BY games_won DESC, win_rate DESC
         LIMIT $1`,
        [limit]
    );

    return result.rows;
}

/**
 * Check if username is available
 * @param {string} username
 * @returns {Promise<boolean>}
 */
export async function isUsernameAvailable(username) {
    const result = await db.query(
        `SELECT EXISTS(SELECT 1 FROM users WHERE username = $1)`,
        [username]
    );

    return !result.rows[0].exists;
}

/**
 * Check if email is available
 * @param {string} email
 * @returns {Promise<boolean>}
 */
export async function isEmailAvailable(email) {
    const result = await db.query(
        `SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)`,
        [email]
    );

    return !result.rows[0].exists;
}

export default {
    createUser,
    findById,
    findByUsername,
    findByEmail,
    authenticate,
    updateProfile,
    updateStats,
    getLeaderboard,
    isUsernameAvailable,
    isEmailAvailable
};
