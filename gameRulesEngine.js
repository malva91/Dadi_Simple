import { effects } from './effects.js';
import { getGameById } from './gdr/index.js';

export function applyGameRules(gameId, roll) {
  const game = getGameById(gameId);
  if (!game) return roll;

  if (!Array.isArray(roll.tags)) roll.tags = [];
  if (!Array.isArray(roll.messages)) roll.messages = [];

  const presetCfg = roll.presetId ? game.presets[roll.presetId] : null;
  if (presetCfg && Array.isArray(presetCfg.effects)) {
    for (const rule of presetCfg.effects) {
      const fn = effects[rule.use];
      if (typeof fn === 'function') {
        fn(roll, rule.params || {});
      }
    }
  }

  if (Array.isArray(game.globalEffects)) {
    for (const rule of game.globalEffects) {
      const fn = effects[rule.use];
      if (typeof fn === 'function') {
        fn(roll, rule.params || {});
      }
    }
  }

  return roll;
}
