import { effects } from './effects.js';
import { getGameById } from './gdr/index.js';

export function applyGameRules(gameId, roll, applyGlobal = true) {
  const game = getGameById(gameId);
  if (!game) return roll;

  if (!Array.isArray(roll.tags)) roll.tags = [];
  if (!Array.isArray(roll.messages)) roll.messages = [];

  // Effetti locali (preset)
  const presetCfg = roll.presetId ? game.presets[roll.presetId] : null;
  if (presetCfg && Array.isArray(presetCfg.effetti)) {
    for (const regola of presetCfg.effetti) {
      const fn = effects[regola.usa];
      if (typeof fn === 'function') {
        fn(roll, regola.parametri || {});
      }
    }
  }

  // Effetti globali (sempre attivi sul gioco, indipendenti dai preset)
  if (applyGlobal && Array.isArray(game.effettiGlobali)) {
    for (const regola of game.effettiGlobali) {
      const fn = effects[regola.usa];
      if (typeof fn === 'function') {
        fn(roll, regola.parametri || {});
      }
    }
  }

  return roll;
}
