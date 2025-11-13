import { drakonia } from './drakonia.js';
import { dnd } from './dnd.js';

export const GDR_MODULES = {
  drakonia,
  dnd5e: dnd,
};

export function getAvailableGames() {
  return Object.values(GDR_MODULES).map(g => ({ id: g.id, name: g.name }));
}

export function getGameById(gameId) {
  return GDR_MODULES[gameId] || null;
}
