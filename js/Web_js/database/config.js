/**
 * SupKonQuest - Database Configuration
 * PostgreSQL connection pool optimized for real-time gaming
 */

import pg from 'pg';
const { Pool } = pg;

// Database configuration from environment variables
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'supkonquest',
    user: process.env.DB_USER || 'supkonquest_app',
    password: process.env.DB_PASSWORD || 'change_this_password',

    // Connection pool settings optimized for real-time games
    max: parseInt(process.env.DB_POOL_MAX) || 20,        // Maximum connections
    min: parseInt(process.env.DB_POOL_MIN) || 5,         // Minimum connections
    idleTimeoutMillis: 30000,                            // Close idle connections after 30s
    connectionTimeoutMillis: 5000,                       // Fail after 5s if can't connect
    allowExitOnIdle: false,                              // Keep pool alive

    // SSL configuration (enable in production)
    ssl: process.env.DB_SSL === 'true' ? {
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
    } : false
};

// Create connection pool
const pool = new Pool(dbConfig);

// Pool event handlers
pool.on('connect', (client) => {
    console.log('[DB] New client connected to pool');
});

pool.on('error', (err, client) => {
    console.error('[DB] Unexpected error on idle client:', err);
});

pool.on('remove', (client) => {
    console.log('[DB] Client removed from pool');
});

/**
 * Execute a query with automatic connection handling
 * @param {string} text - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<pg.QueryResult>}
 */
export async function query(text, params = []) {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;

        // Log slow queries (>100ms)
        if (duration > 100) {
            console.warn(`[DB] Slow query (${duration}ms):`, text.substring(0, 100));
        }

        return result;
    } catch (error) {
        console.error('[DB] Query error:', error.message);
        throw error;
    }
}

/**
 * Get a client from the pool for transactions
 * @returns {Promise<pg.PoolClient>}
 */
export async function getClient() {
    const client = await pool.connect();
    const originalRelease = client.release.bind(client);

    // Track client checkout time
    const checkoutTime = Date.now();

    // Override release to add logging
    client.release = () => {
        const duration = Date.now() - checkoutTime;
        if (duration > 5000) {
            console.warn(`[DB] Client held for ${duration}ms`);
        }
        return originalRelease();
    };

    return client;
}

/**
 * Execute a transaction with automatic rollback on error
 * @param {Function} callback - Function receiving client
 * @returns {Promise<any>}
 */
export async function transaction(callback) {
    const client = await getClient();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Health check for database connection
 * @returns {Promise<boolean>}
 */
export async function healthCheck() {
    try {
        const result = await query('SELECT NOW()');
        return result.rows.length > 0;
    } catch (error) {
        console.error('[DB] Health check failed:', error.message);
        return false;
    }
}

/**
 * Get pool statistics
 * @returns {Object}
 */
export function getPoolStats() {
    return {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount
    };
}

/**
 * Graceful shutdown
 */
export async function shutdown() {
    console.log('[DB] Closing pool...');
    await pool.end();
    console.log('[DB] Pool closed');
}

// Handle process termination
process.on('SIGINT', async () => {
    await shutdown();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await shutdown();
    process.exit(0);
});

export default {
    query,
    getClient,
    transaction,
    healthCheck,
    getPoolStats,
    shutdown,
    pool
};
