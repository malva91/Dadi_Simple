export const effects = {
  highlightHighest(roll, { count = 1 } = {}) {
    const sorted = roll.dice
      .map((d, i) => ({ d, i }))
      .sort((a, b) => b.d.value - a.d.value);
    sorted.slice(0, count).forEach(({ i }) => {
      roll.dice[i].highlight = true;
    });
    return roll;
  },

  highlightLowest(roll, { count = 1 } = {}) {
    const sorted = roll.dice
      .map((d, i) => ({ d, i }))
      .sort((a, b) => a.d.value - b.d.value);
    sorted.slice(0, count).forEach(({ i }) => {
      roll.dice[i].highlight = true;
    });
    return roll;
  },

  highlightAll(roll) {
    roll.dice.forEach(d => {
      d.highlight = true;
    });
    return roll;
  },

  checkDoubleSixOnHighlighted(roll) {
    const highlighted = roll.dice.filter(d => d.highlight && d.value === 6);
    if (highlighted.length >= 2) {
      if (!roll.tags.includes('successo_critico')) {
        roll.tags.push('successo_critico');
        roll.messages.push('🎲 Doppio 6 sui risultati evidenziati: Successo Critico!');
      }
    }
    return roll;
  },

  critOn(roll, { value = 20, message = 'Successo critico!', onlyFor = null } = {}) {
    const matching = roll.dice.filter(d => {
      if (onlyFor && d.sides !== parseInt(onlyFor.replace('d', ''), 10)) return false;
      return d.value === value;
    });
    if (matching.length > 0) {
      if (!roll.tags.includes('successo_critico')) {
        roll.tags.push('successo_critico');
        roll.messages.push(message);
      }
    }
    return roll;
  },

  fumbleOn(roll, { value = 1, message = 'Fallimento critico!', onlyFor = null } = {}) {
    const matching = roll.dice.filter(d => {
      if (onlyFor && d.sides !== parseInt(onlyFor.replace('d', ''), 10)) return false;
      return d.value === value;
    });
    if (matching.length > 0) {
      if (!roll.tags.includes('fallimento_critico')) {
        roll.tags.push('fallimento_critico');
        roll.messages.push(message);
      }
    }
    return roll;
  },
};
