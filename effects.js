export const effects = {
  evidenziaAlti(roll, { conteggio = 1 } = {}) {
    const ordinati = roll.dice
      .map((d, i) => ({ d, i }))
      .sort((a, b) => b.d.value - a.d.value);
    ordinati.slice(0, conteggio).forEach(({ i }) => {
      roll.dice[i].highlight = true;
    });
    return roll;
  },

  evidenziaBassi(roll, { conteggio = 1 } = {}) {
    const ordinati = roll.dice
      .map((d, i) => ({ d, i }))
      .sort((a, b) => a.d.value - b.d.value);
    ordinati.slice(0, conteggio).forEach(({ i }) => {
      roll.dice[i].highlight = true;
    });
    return roll;
  },

  evidenziaTutti(roll) {
    roll.dice.forEach(d => {
      d.highlight = true;
    });
    return roll;
  },

  controllaDoppioSei(roll) {
    const evidenziati = roll.dice.filter(d => d.highlight && d.value === 6);
    if (evidenziati.length >= 2) {
      if (!roll.tags.includes('successo_critico')) {
        roll.tags.push('successo_critico');
        roll.messages.push('Doppio 6 sui risultati evidenziati: Successo Critico!');
      }
    }
    return roll;
  },

  criticoSu(roll, { valore = 20, messaggio = 'Successo critico!', soloPer = null } = {}) {
    const corrispondenti = roll.dice.filter(d => {
      if (soloPer && d.sides !== parseInt(soloPer.replace('d', ''), 10)) return false;
      return d.value === valore;
    });
    if (corrispondenti.length > 0) {
      if (!roll.tags.includes('successo_critico')) {
        roll.tags.push('successo_critico');
        roll.messages.push(messaggio);
      }
    }
    return roll;
  },

  fallimentoSu(roll, { valore = 1, messaggio = 'Fallimento critico!', soloPer = null } = {}) {
    const corrispondenti = roll.dice.filter(d => {
      if (soloPer && d.sides !== parseInt(soloPer.replace('d', ''), 10)) return false;
      return d.value === valore;
    });
    if (corrispondenti.length > 0) {
      if (!roll.tags.includes('fallimento_critico')) {
        roll.tags.push('fallimento_critico');
        roll.messages.push(messaggio);
      }
    }
    return roll;
  },
};
