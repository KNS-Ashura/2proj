/**
 * SupKonQuest - Unit Template Repository
 * Database operations for unit and ship templates
 */

import db from '../config.js';

// ============================================================
// UNIT TEMPLATES
// ============================================================

/**
 * Get all unit templates
 * @param {boolean} includeAdvanced - Include advanced units from neutral camps
 * @returns {Promise<Array>}
 */
export async function getAllUnits(includeAdvanced = true) {
    let query = `
        SELECT * FROM unit_templates
        WHERE 1=1
    `;

    if (!includeAdvanced) {
        query += ' AND is_advanced = FALSE';
    }

    query += ' ORDER BY price ASC';

    const result = await db.query(query);
    return result.rows;
}

/**
 * Get unit template by ID
 * @param {number} unitId
 * @returns {Promise<Object|null>}
 */
export async function getUnitById(unitId) {
    const result = await db.query(
        `SELECT * FROM unit_templates WHERE id = $1`,
        [unitId]
    );

    return result.rows[0] || null;
}

/**
 * Get unit template by type
 * @param {string} unitType
 * @param {boolean} advanced - Get advanced version
 * @returns {Promise<Object|null>}
 */
export async function getUnitByType(unitType, advanced = false) {
    const result = await db.query(
        `SELECT * FROM unit_templates
         WHERE unit_type = $1 AND is_advanced = $2
         LIMIT 1`,
        [unitType, advanced]
    );

    return result.rows[0] || null;
}

/**
 * Get units available for standard camps
 * @returns {Promise<Array>}
 */
export async function getStandardUnits() {
    const result = await db.query(
        `SELECT * FROM unit_templates
         WHERE is_advanced = FALSE
         ORDER BY price ASC`
    );

    return result.rows;
}

/**
 * Get units available for neutral camps
 * @returns {Promise<Array>}
 */
export async function getAdvancedUnits() {
    const result = await db.query(
        `SELECT * FROM unit_templates
         WHERE is_advanced = TRUE
         ORDER BY price ASC`
    );

    return result.rows;
}

/**
 * Calculate damage with modifiers
 * @param {Object} attacker - Unit template
 * @param {Object} defender - Unit template
 * @returns {number} - Modified damage
 */
export function calculateDamage(attacker, defender) {
    let damage = attacker.base_damage;

    if (attacker.damage_modifiers && defender.unit_type) {
        const modifier = attacker.damage_modifiers[defender.unit_type];
        if (modifier) {
            damage = Math.round(damage * modifier);
        }
    }

    return damage;
}

/**
 * Get effective damage table for all unit matchups
 * @returns {Promise<Object>}
 */
export async function getDamageTable() {
    const units = await getAllUnits(false);
    const table = {};

    for (const attacker of units) {
        table[attacker.unit_type] = {};
        for (const defender of units) {
            table[attacker.unit_type][defender.unit_type] = calculateDamage(attacker, defender);
        }
    }

    return table;
}

// ============================================================
// SHIP TEMPLATES
// ============================================================

/**
 * Get all ship templates
 * @returns {Promise<Array>}
 */
export async function getAllShips() {
    const result = await db.query(
        `SELECT * FROM ship_templates ORDER BY price ASC`
    );

    return result.rows;
}

/**
 * Get ship template by ID
 * @param {number} shipId
 * @returns {Promise<Object|null>}
 */
export async function getShipById(shipId) {
    const result = await db.query(
        `SELECT * FROM ship_templates WHERE id = $1`,
        [shipId]
    );

    return result.rows[0] || null;
}

/**
 * Get ship template by type
 * @param {string} shipType
 * @returns {Promise<Object|null>}
 */
export async function getShipByType(shipType) {
    const result = await db.query(
        `SELECT * FROM ship_templates WHERE ship_type = $1`,
        [shipType]
    );

    return result.rows[0] || null;
}

/**
 * Get transport ship template
 * @returns {Promise<Object|null>}
 */
export async function getTransportShip() {
    return getShipByType('transport');
}

// ============================================================
// GAME BALANCE UTILITIES
// ============================================================

/**
 * Get unit cost efficiency (damage per gold)
 * @param {Object} unit
 * @returns {number}
 */
export function getCostEfficiency(unit) {
    const dps = unit.base_damage * unit.hit_speed;
    return dps / unit.price;
}

/**
 * Get all units sorted by cost efficiency
 * @returns {Promise<Array>}
 */
export async function getUnitsByEfficiency() {
    const units = await getAllUnits(false);

    return units
        .map(unit => ({
            ...unit,
            efficiency: getCostEfficiency(unit)
        }))
        .sort((a, b) => b.efficiency - a.efficiency);
}

/**
 * Calculate effective HP (considering heal potential)
 * @param {Object} unit
 * @returns {number}
 */
export function getEffectiveHP(unit) {
    // Base HP with slight bonus for speed (harder to hit fast units)
    return unit.base_hp * (1 + (unit.walk_speed / 10));
}

/**
 * Get counter recommendations for a unit type
 * @param {string} unitType
 * @returns {Promise<Array>}
 */
export async function getCounters(unitType) {
    const units = await getAllUnits(false);

    const counters = units
        .filter(unit => {
            if (!unit.damage_modifiers) return false;
            const modifier = unit.damage_modifiers[unitType];
            return modifier && modifier > 1.5;
        })
        .sort((a, b) => {
            const modA = a.damage_modifiers[unitType] || 1;
            const modB = b.damage_modifiers[unitType] || 1;
            return modB - modA;
        });

    return counters;
}

export default {
    // Unit templates
    getAllUnits,
    getUnitById,
    getUnitByType,
    getStandardUnits,
    getAdvancedUnits,
    calculateDamage,
    getDamageTable,

    // Ship templates
    getAllShips,
    getShipById,
    getShipByType,
    getTransportShip,

    // Balance utilities
    getCostEfficiency,
    getUnitsByEfficiency,
    getEffectiveHP,
    getCounters
};
