export const dnd = {
  id: 'dnd5e',
  name: 'Dungeons & Dragons 5e',
  presets: {
    d20: {
      label: 'Tiro D20',
      dice: '1d20',
      effects: [
        { use: 'critOn', params: { value: 20, message: '🎲 Successo Critico!' } },
        { use: 'fumbleOn', params: { value: 1, message: '🎲 Fallimento Critico!' } },
      ],
    },
  },
  globalEffects: [],
};
