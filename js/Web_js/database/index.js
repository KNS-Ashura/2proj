/**
 * SupKonQuest - Database Module
 * Central export for all database functionality
 */

// Database configuration and utilities
export { default as db } from './config.js';
export {
    query,
    getClient,
    transaction,
    healthCheck,
    getPoolStats,
    shutdown
} from './config.js';

// Repositories
export { default as UserRepository } from './repositories/UserRepository.js';
export { default as GameRepository } from './repositories/GameRepository.js';
export { default as MapRepository } from './repositories/MapRepository.js';
export { default as UnitTemplateRepository } from './repositories/UnitTemplateRepository.js';

// Re-export commonly used functions for convenience
export {
    createUser,
    authenticate,
    findById as findUserById
} from './repositories/UserRepository.js';

export {
    createGame,
    getGameState,
    addPlayer,
    updatePlayerMoney
} from './repositories/GameRepository.js';

export {
    getMapTemplates,
    getMapForGame
} from './repositories/MapRepository.js';

export {
    getAllUnits,
    getAllShips,
    calculateDamage
} from './repositories/UnitTemplateRepository.js';
