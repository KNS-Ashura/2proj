/**
 * SupKonQuest - Map Repository
 * Database operations for map templates and regions
 */

import db from '../config.js';

/**
 * Get all active map templates
 * @param {Object} filters
 * @returns {Promise<Array>}
 */
export async function getMapTemplates({ minPlayers, maxPlayers, theme, difficulty } = {}) {
    let query = `
        SELECT id, name, description, width, height, tile_width, tile_height,
               min_players, max_players, theme, difficulty, preview_image_url
        FROM map_templates
        WHERE is_active = TRUE
    `;
    const params = [];
    let paramIndex = 1;

    if (minPlayers) {
        query += ` AND max_players >= $${paramIndex++}`;
        params.push(minPlayers);
    }

    if (maxPlayers) {
        query += ` AND min_players <= $${paramIndex++}`;
        params.push(maxPlayers);
    }

    if (theme) {
        query += ` AND theme = $${paramIndex++}`;
        params.push(theme);
    }

    if (difficulty) {
        query += ` AND difficulty = $${paramIndex++}`;
        params.push(difficulty);
    }

    query += ' ORDER BY name';

    const result = await db.query(query, params);
    return result.rows;
}

/**
 * Get map template by ID with full tile data
 * @param {number} mapId
 * @returns {Promise<Object|null>}
 */
export async function getMapById(mapId) {
    const result = await db.query(
        `SELECT * FROM map_templates WHERE id = $1`,
        [mapId]
    );

    return result.rows[0] || null;
}

/**
 * Get map template without tile data (for listings)
 * @param {number} mapId
 * @returns {Promise<Object|null>}
 */
export async function getMapMetadata(mapId) {
    const result = await db.query(
        `SELECT id, name, description, width, height, tile_width, tile_height,
                min_players, max_players, theme, difficulty, preview_image_url
         FROM map_templates
         WHERE id = $1`,
        [mapId]
    );

    return result.rows[0] || null;
}

/**
 * Get regions for a map
 * @param {number} mapId
 * @returns {Promise<Array>}
 */
export async function getMapRegions(mapId) {
    const result = await db.query(
        `SELECT id, name, color, money_bonus, unit_bonus_type,
                unit_bonus_count, unit_bonus_interval, boundary_points
         FROM map_regions
         WHERE map_template_id = $1`,
        [mapId]
    );

    return result.rows;
}

/**
 * Get camp positions for a map
 * @param {number} mapId
 * @returns {Promise<Array>}
 */
export async function getMapCampPositions(mapId) {
    const result = await db.query(
        `SELECT mcp.*, mr.name AS region_name
         FROM map_camp_positions mcp
         LEFT JOIN map_regions mr ON mcp.region_id = mr.id
         WHERE mcp.map_template_id = $1
         ORDER BY mcp.is_starting_position DESC, mcp.camp_type`,
        [mapId]
    );

    return result.rows;
}

/**
 * Get starting positions for a map
 * @param {number} mapId
 * @returns {Promise<Array>}
 */
export async function getStartingPositions(mapId) {
    const result = await db.query(
        `SELECT tile_x, tile_y, camp_type
         FROM map_camp_positions
         WHERE map_template_id = $1 AND is_starting_position = TRUE`,
        [mapId]
    );

    return result.rows;
}

/**
 * Get complete map data for game initialization
 * @param {number} mapId
 * @returns {Promise<Object>}
 */
export async function getMapForGame(mapId) {
    const [map, regions, campPositions] = await Promise.all([
        getMapById(mapId),
        getMapRegions(mapId),
        getMapCampPositions(mapId)
    ]);

    if (!map) {
        return null;
    }

    return {
        ...map,
        regions,
        campPositions
    };
}

/**
 * Get tile at specific position from map data
 * @param {Object} map - Map with tile_data
 * @param {number} x
 * @param {number} y
 * @returns {Object|null}
 */
export function getTileAt(map, x, y) {
    if (!map.tile_data || !Array.isArray(map.tile_data)) {
        return null;
    }

    if (y < 0 || y >= map.tile_data.length) {
        return null;
    }

    if (x < 0 || x >= map.tile_data[y].length) {
        return null;
    }

    return map.tile_data[y][x];
}

/**
 * Check if a position is walkable
 * @param {Object} map
 * @param {number} x
 * @param {number} y
 * @returns {boolean}
 */
export function isWalkable(map, x, y) {
    const tile = getTileAt(map, x, y);
    if (!tile) return false;

    const walkableTypes = ['grass', 'sand', 'road'];
    return walkableTypes.includes(tile.type);
}

/**
 * Check if a position is navigable (for ships)
 * @param {Object} map
 * @param {number} x
 * @param {number} y
 * @returns {boolean}
 */
export function isNavigable(map, x, y) {
    const tile = getTileAt(map, x, y);
    if (!tile) return false;

    return tile.type === 'water';
}

/**
 * Find which region a position belongs to
 * @param {Array} regions - Array of region objects with boundary_points
 * @param {number} x
 * @param {number} y
 * @returns {Object|null} - Region or null if not in any region
 */
export function findRegionAtPosition(regions, x, y) {
    for (const region of regions) {
        if (isPointInPolygon(x, y, region.boundary_points)) {
            return region;
        }
    }
    return null;
}

/**
 * Ray casting algorithm to check if point is in polygon
 * @param {number} x
 * @param {number} y
 * @param {Array} polygon - Array of {x, y} points
 * @returns {boolean}
 */
function isPointInPolygon(x, y, polygon) {
    if (!Array.isArray(polygon) || polygon.length < 3) {
        return false;
    }

    let inside = false;
    const n = polygon.length;

    for (let i = 0, j = n - 1; i < n; j = i++) {
        const xi = polygon[i].x;
        const yi = polygon[i].y;
        const xj = polygon[j].x;
        const yj = polygon[j].y;

        if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
            inside = !inside;
        }
    }

    return inside;
}

export default {
    getMapTemplates,
    getMapById,
    getMapMetadata,
    getMapRegions,
    getMapCampPositions,
    getStartingPositions,
    getMapForGame,
    getTileAt,
    isWalkable,
    isNavigable,
    findRegionAtPosition
};
