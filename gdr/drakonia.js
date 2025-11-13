export const drakonia = {
  id: 'drakonia',
  name: 'Drakonia',
  presets: {
    facilissimo: {
      label: 'Facilissimo',
      dice: '4d6',
      effects: [
        { use: 'highlightHighest', params: { count: 2 } },
        { use: 'checkDoubleSixOnHighlighted' },
      ],
    },
    facile: {
      label: 'Facile',
      dice: '3d6',
      effects: [
        { use: 'highlightHighest', params: { count: 2 } },
        { use: 'checkDoubleSixOnHighlighted' },
      ],
    },
    normale: {
      label: 'Normale',
      dice: '2d6',
      effects: [
        { use: 'highlightAll' },
        { use: 'checkDoubleSixOnHighlighted' },
      ],
    },
    difficile: {
      label: 'Difficile',
      dice: '3d6',
      effects: [
        { use: 'highlightLowest', params: { count: 2 } },
        { use: 'checkDoubleSixOnHighlighted' },
      ],
    },
    difficilissimo: {
      label: 'Difficilissimo',
      dice: '4d6',
      effects: [
        { use: 'highlightLowest', params: { count: 2 } },
        { use: 'checkDoubleSixOnHighlighted' },
      ],
    },
  },
  globalEffects: [],
};
