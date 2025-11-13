export const drakonia = {
  id: 'drakonia',
  name: 'Drakonia',
  presets: {
    facilissimo: {
      label: 'Facilissimo',
      dice: '4d6',
      effetti: [
        { usa: 'evidenziaAlti', parametri: { conteggio: 2 } },
        { usa: 'controllaDoppioSei' },
      ],
    },
    facile: {
      label: 'Facile',
      dice: '3d6',
      effetti: [
        { usa: 'evidenziaAlti', parametri: { conteggio: 2 } },
        { usa: 'controllaDoppioSei' },
      ],
    },
    normale: {
      label: 'Normale',
      dice: '2d6',
      effetti: [
        { usa: 'evidenziaTutti' },
        { usa: 'controllaDoppioSei' },
      ],
    },
    difficile: {
      label: 'Difficile',
      dice: '3d6',
      effetti: [
        { usa: 'evidenziaBassi', parametri: { conteggio: 2 } },
        { usa: 'controllaDoppioSei' },
      ],
    },
    difficilissimo: {
      label: 'Difficilissimo',
      dice: '4d6',
      effetti: [
        { usa: 'evidenziaBassi', parametri: { conteggio: 2 } },
        { usa: 'controllaDoppioSei' },
      ],
    },
  },
  effettiGlobali: [],
};
