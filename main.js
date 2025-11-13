// === UTIL ===

// RNG sicuro senza bias (rejection sampling)
function cryptoInt(maxExclusive) {
  if (!Number.isInteger(maxExclusive) || maxExclusive <= 0 || maxExclusive > 0x100000000) {
    throw new Error("maxExclusive non valido");
  }
  const buf = new Uint32Array(1);
  const lim = Math.floor(0x100000000 / maxExclusive) * maxExclusive;
  while (true) {
    crypto.getRandomValues(buf);
    if (buf[0] < lim) return buf[0] % maxExclusive;
  }
}

// Intero in [min, max]
function cryptoIntRange(min, max) {
  if (!Number.isFinite(min) || !Number.isFinite(max)) throw new Error("Intervallo non valido");
  min = Math.ceil(min); max = Math.floor(max);
  if (max < min) [min, max] = [max, min];
  const span = max - min + 1;
  return min + cryptoInt(span);
}

// Colore testo leggibile su background
function textOn(bg) {
  try {
    const c = bg.replace('#', '');
    const r = parseInt(c.substr(0, 2), 16), g = parseInt(c.substr(2, 2), 16), b = parseInt(c.substr(4, 2), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? '#000' : '#fff';
  } catch {
    return '#fff';
  }
}

// Debounce semplice
function debounce(fn, wait = 250) {
  let t = null;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

// Import moduli GdR
import { getAvailableGames, getGameById } from './gdr/index.js';
import { applyGameRules } from './gameRulesEngine.js';

// Verifica config essenziale
(function assertConfig() {
  if (!window.APP_CONFIG) throw new Error("APP_CONFIG mancante (carica config.js prima di main.js)");
  const { ROOM_NAME, COLOR_PALETTE, DICE_SIDES, DICE_COLORS, CUSTOM_DICE_TYPES } = APP_CONFIG;
  if (!ROOM_NAME || typeof ROOM_NAME !== "string") throw new Error("APP_CONFIG.ROOM_NAME mancante/non valido");
  if (!Array.isArray(COLOR_PALETTE) || !COLOR_PALETTE.length) throw new Error("APP_CONFIG.COLOR_PALETTE mancante/vuota");
  if (!Array.isArray(DICE_SIDES) || !DICE_SIDES.length) throw new Error("APP_CONFIG.DICE_SIDES mancante/vuota");
  if (!Array.isArray(DICE_COLORS) || !DICE_COLORS.length) throw new Error("APP_CONFIG.DICE_COLORS mancante/vuota");
  if (!CUSTOM_DICE_TYPES || typeof CUSTOM_DICE_TYPES !== "object") throw new Error("APP_CONFIG.CUSTOM_DICE_TYPES mancante");
})();

class TavernaDeiCaniDiOdino {
  constructor() {
    // Stato
    this.currentUser = null;
    this.currentRoom = null;
    this.database = window.database; // istanza firebase.database()
    this.roomRef = null;
    this.usersRef = null;
    this.diceResultsRef = null;
    this.chatRef = null;
    this.heartbeatInterval = null;
    this._usersEmptySince = null;

    // Config
    this.colorPalette = APP_CONFIG.COLOR_PALETTE;
    this.numericDiceSides = APP_CONFIG.DICE_SIDES;
    this.customDiceTypes = APP_CONFIG.CUSTOM_DICE_TYPES;
    this.diceColors = APP_CONFIG.DICE_COLORS;
    this.maxDicePerRow = 10;
    this.maxRows = 20;

    // GdR
    this.activeGameId = null;
    this.activePresetId = null;

    // UI
    this.initializeElements();
    this.bindEvents();
    this.initializeGdRSelector();

    // Blocca/valorizza campo stanza
    this.roomCodeInput.value = APP_CONFIG.ROOM_NAME;
    this.roomCodeInput.setAttribute("disabled", "disabled");

    // Costruisci la riga dadi iniziale da config
    this.rebuildAllDiceTypeSelects();
    this.rebuildAllDiceColorSelects();
  }

  // ======= UI =======
  initializeElements() {
    // Screens
    this.loginScreen = document.getElementById('loginScreen');
    this.gameScreen = document.getElementById('gameScreen');

    // Login
    this.loginForm = document.getElementById('loginForm');
    this.playerNameInput = document.getElementById('playerName');
    this.roomCodeInput = document.getElementById('roomCode');

    // Clear buttons
    this.clearChatBtn = document.getElementById('clearChat');
    this.clearDiceBtn = document.getElementById('clearDice');

    // Game
    this.currentRoomSpan = document.getElementById('currentRoom');
    this.leaveRoomBtn = document.getElementById('leaveRoom');
    this.cleanupUsersBtn = document.getElementById('cleanupUsers');
    this.headerUsersList = document.getElementById('headerUsersList');
    this.diceResults = document.getElementById('diceResults');
    this.chatMessages = document.getElementById('chatMessages');
    this.diceRows = document.getElementById('diceRows');
    this.addDiceBtn = document.getElementById('addDice');
    this.rollDiceBtn = document.getElementById('rollDice');
    this.chatInput = document.getElementById('chatInput');
    this.sendMessageBtn = document.getElementById('sendMessage');

    // GdR
    this.gameSelect = document.getElementById('gameSelect');
    this.presetButtons = document.getElementById('presetButtons');
  }

  bindEvents() {
    this.loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.joinRoom();
    });

    this.leaveRoomBtn.addEventListener('click', () => this.leaveRoom());
    this.cleanupUsersBtn.addEventListener('click', () => this.cleanupDisconnectedUsers());
    this.addDiceBtn.addEventListener('click', () => this.addDiceRow());
    this.rollDiceBtn.addEventListener('click', () => this.rollAllDice());

    const debouncedSend = debounce(() => this.sendChatMessage(), 120);
    this.sendMessageBtn.addEventListener('click', debouncedSend);
    this.chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') debouncedSend(); });

    this.clearChatBtn.addEventListener('click', () => this.clearChat());
    this.clearDiceBtn.addEventListener('click', () => this.clearDiceResults());

    // Delegation: rimozione riga dadi
    this.diceRows.addEventListener('click', (e) => {
      if (e.target.classList.contains('remove-dice')) {
        this.removeDiceRow(e.target.closest('.dice-input-group'));
      }
    });

    // Disconnessione
    window.addEventListener('beforeunload', () => {
      if (this.currentUser && this.currentRoom) this.removeUserFromRoom();
    });
  }

  // ======= JOIN / LEAVE =======
  cleanupBindings() {
    try {
      if (this.usersRef) this.usersRef.off();
      if (this.diceResultsRef) this.diceResultsRef.off();
      if (this.chatRef) this.chatRef.off();
      if (this._connectedRef) this._connectedRef.off();
      if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    } catch {}
    this.heartbeatInterval = null;
    this._connectedRef = null;
  }

  async joinRoom() {
    const playerName = (this.playerNameInput.value || '').trim();
    const roomCode = String(APP_CONFIG.ROOM_NAME).trim();
    if (!playerName) return;

    // Hardening ROOM_NAME
    if (roomCode.length > 80 || roomCode.includes('/')) {
      console.error('ROOM_NAME non valido'); return;
    }

    try {
      this.cleanupBindings();

      // Credenziali locali
      const savedUserId = localStorage.getItem(`taverna_${roomCode}_userId`);
      const savedUserColor = localStorage.getItem(`taverna_${roomCode}_userColor`);

      const makeId = () => (crypto.randomUUID ? crypto.randomUUID() : (String(Date.now()) + "_" + cryptoInt(1e9)));

      this.currentUser = {
        id: savedUserId || makeId(),
        name: playerName,
        // joinedAt/lastSeen saranno impostati lato server
      };

      // Firebase refs
      this.currentRoom = roomCode;
      this.currentRoomSpan.textContent = roomCode;
      this.roomRef = this.database.ref(`rooms/${roomCode}`);
      this.usersRef = this.roomRef.child('users');
      this.diceResultsRef = this.roomRef.child('diceResults');
      this.chatRef = this.roomRef.child('chat');

      // Assegnazione colore utente (transazione con rimozione colore dall'array)
      let userColor = null;
      const colorRef = this.roomRef.child('availableColors');
      await colorRef.transaction(colors => {
        let available = Array.isArray(colors) ? [...colors] : [...this.colorPalette];
        available = Array.from(new Set(available));
        if (available.length === 0) available = [...this.colorPalette];
        const idx = cryptoInt(available.length);
        userColor = available[idx];
        return available.filter((_, i) => i !== idx);
      });

      this.currentUser.color = userColor;
      localStorage.setItem(`taverna_${roomCode}_userId`, this.currentUser.id);
      localStorage.setItem(`taverna_${roomCode}_userColor`, userColor);

      // Sessione (salvo dopo l'esito positivo)
      // Scrittura utente con timestamp server
      const SVT = firebase.database.ServerValue.TIMESTAMP;
      await this.usersRef.child(this.currentUser.id).set({
        id: this.currentUser.id,
        name: this.currentUser.name,
        color: this.currentUser.color,
        joinedAt: SVT,
        lastSeen: SVT
      });

      // Listener e presenza
      this.setupFirebaseListeners();

      // UI
      this.showGameScreen();
      sessionStorage.setItem('tavernaPlayerName', playerName);
      sessionStorage.setItem('tavernaRoomCode', roomCode);

    } catch (error) {
      console.error('Errore accesso stanza:', error);
    }
  }

  async leaveRoom() {
    await this.removeUserFromRoom();
    this.cleanupBindings();

    sessionStorage.removeItem('tavernaPlayerName');
    sessionStorage.removeItem('tavernaRoomCode');

    this.currentUser = null;
    this.currentRoom = null;
    this.roomRef = null; this.usersRef = null; this.diceResultsRef = null; this.chatRef = null;

    this.playerNameInput.value = '';
    this.roomCodeInput.value = '';
    this.diceResults.innerHTML = '';
    this.chatMessages.innerHTML = '';
    this.chatInput.value = '';

    this.showLoginScreen();
  }

  // ======= FIREBASE LISTENERS =======
  setupFirebaseListeners() {
  // --- LISTA UTENTI + RESET IMMEDIATO DELLA STANZA SE VUOTA ---
  this.usersRef.on('value', (snapshot) => {
    const users = snapshot.val() || {};
    this.updateUsersList(users);

    const count = Object.keys(users).length;

    // Se non c'è nessun utente, reset immediato della stanza
    if (count === 0) {
      // Rimuove l'intero nodo "rooms/<ROOM_NAME>" (chat, dadi, colori inclusi)
      this.roomRef
        .remove()
        .catch(() => { /* ignora errori transienti */ });
    }
  });

  // --- DADI: stream ultimi 20 ---
  this.diceResultsRef.limitToLast(20).on('child_added', (s) => {
    const v = s.val();
    if (v) this.addDiceResultToDisplay(v);
  });

  // --- CHAT: stream ultime 50 ---
  this.chatRef.limitToLast(50).on('child_added', (s) => {
    const v = s.val();
    if (v) this.addChatMessage(v);
  });

  // --- PRESENZA AFFIDABILE: registra onDisconnect solo se realmente connessi ---
  this._connectedRef = this.database.ref('.info/connected');
  this._connectedRef.on('value', (snap) => {
    if (snap.val() === true && this.currentUser && this.usersRef) {
      this.usersRef.child(this.currentUser.id).onDisconnect().remove();
    }
  });

  // --- HEARTBEAT: aggiorna lastSeen lato server ogni 30s ---
  const SVT = firebase.database.ServerValue.TIMESTAMP;
  this.heartbeatInterval = setInterval(() => {
    if (this.usersRef && this.currentUser) {
      this.usersRef.child(this.currentUser.id).update({ lastSeen: SVT }).catch(() => {});
    }
  }, 30000);
}


  // ======= RENDER / UI =======
  updateUsersList(users) {
    if (!users || typeof users !== 'object') {
      this.headerUsersList.innerHTML = '';
      return;
    }
    const validUsers = Object.values(users).filter(u => u && u.name && u.color);
    if (validUsers.length === 0) {
      this.headerUsersList.innerHTML = '';
      return;
    }
    this.headerUsersList.innerHTML = '';
    validUsers.forEach(user => {
      const badge = document.createElement('div');
      badge.className = 'user-badge';
      badge.style.backgroundColor = user.color;
      badge.style.color = textOn(user.color);
      badge.textContent = `🐺 ${this.escapeHtml(user.name)}`;
      this.headerUsersList.appendChild(badge);
    });
  }

  addDiceResultToDisplay(result) {
    const resultDiv = document.createElement('div');
    resultDiv.className = 'dice-result';
    resultDiv.style.backgroundColor = result.color || '#444';
    resultDiv.style.color = textOn(result.color || '#444');

    const safe = (s) => this.escapeHtml(String(s ?? ''));

    let content = `<div class="player-name" style="padding:2px;">🐺 ${safe(result.playerName)}</div>`;
    content += `<div class="dice-details">`;

    (result.results || []).forEach(dice => {
      const colorEmoji = this.getColorEmoji(dice.color);
      const safeEmoji = safe(colorEmoji);
      const highlight = dice.highlight ? ' style="background-color:rgba(255,215,0,0.5); padding:2px 4px; border-radius:3px;"' : '';
      if (dice.type === 'custom') {
        const diceEmoji = dice.emoji ? safe(dice.emoji) : '';
        content += `<span${highlight}>${safeEmoji}${diceEmoji ? diceEmoji + ' ' : ''}${safe(dice.displayName)} = <strong>${safe(dice.value)}</strong></span><br>`;
      } else {
        content += `<span${highlight}>${safeEmoji}🎲 D${safe(dice.sides)} = <strong>${safe(dice.value)}</strong></span><br>`;
      }
    });

    content += `</div>`;

    if (result.messages && result.messages.length > 0) {
      content += `<div class="gdr-messages" style="margin-top:8px; padding:8px; background:rgba(0,0,0,0.3); border-radius:3px; font-size:0.9em;">`;
      result.messages.forEach(msg => {
        content += `<div style="margin:4px 0;">${safe(msg)}</div>`;
      });
      content += `</div>`;
    }

    const numericResults = (result.results || []).filter(d => d.type === 'numeric' && Number.isFinite(d.value));
    if (numericResults.length > 0) {
      const total = numericResults.reduce((sum, d) => sum + Number(d.value || 0), 0);
      const modifierEl = document.getElementById('diceModifier');
      const modifier = modifierEl ? (parseInt(modifierEl.value, 10) || 0) : 0;
      const totalWithMod = total + modifier;
      const modSign = modifier >= 0 ? '+' + modifier : modifier;
      content += `<div class="total">⚔️ Totale = ${safe(total)}${safe(modSign)} = <strong>${safe(totalWithMod)}</strong></div>`;
    }

    resultDiv.innerHTML = content;
    this.diceResults.insertBefore(resultDiv, this.diceResults.firstChild);
    while (this.diceResults.children.length > 50) {
      this.diceResults.removeChild(this.diceResults.lastChild);
    }
  }

  addChatMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message';
    messageDiv.style.backgroundColor = message.color || '#333';
    messageDiv.style.color = textOn(message.color || '#333');

    const time = new Date(message.timestamp || Date.now()).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    const safe = (s) => this.escapeHtml(String(s ?? ''));

    messageDiv.innerHTML = `
      <div class="message-header">
        <span class="message-author" style="padding:2px;">🐺 ${safe(message.playerName)}</span>
        <span class="message-time">${safe(time)}</span>
      </div>
      <div class="message-text">${safe(message.text)}</div>
    `;

    this.chatMessages.insertBefore(messageDiv, this.chatMessages.firstChild);
    while (this.chatMessages.children.length > 100) {
      this.chatMessages.removeChild(this.chatMessages.lastChild);
    }
  }

  // === UI DINAMICA BASATA SU CONFIG ===
  addDiceRow() {
    if (this.diceRows.children.length >= this.maxRows) return;

    const diceRow = document.createElement('div');
    diceRow.className = 'dice-input-group';

    diceRow.innerHTML = `
      <select class="dice-count"></select>
      <span class="dice-separator">d</span>
      <select class="dice-type"></select>
      <select class="dice-color"></select>
      <button type="button" class="remove-dice">❌</button>
    `;

    // Count 1..maxDicePerRow
    const countSel = diceRow.querySelector('.dice-count');
    for (let n = 1; n <= this.maxDicePerRow; n++) {
      const opt = document.createElement('option');
      opt.value = String(n);
      opt.textContent = String(n);
      if (n === 1) opt.selected = true;
      countSel.appendChild(opt);
    }

    // Type & Color da config
    this.rebuildDiceTypeSelect(diceRow.querySelector('.dice-type'));
    this.rebuildDiceColorSelect(diceRow.querySelector('.dice-color'));

    this.diceRows.insertBefore(diceRow, this.diceRows.firstChild);
  }

  rebuildAllDiceTypeSelects() {
    document.querySelectorAll('select.dice-type').forEach(sel => this.rebuildDiceTypeSelect(sel));
  }

  rebuildDiceTypeSelect(select) {
    while (select.firstChild) select.removeChild(select.firstChild);

    // Numeric dal config, solo >=2
    this.numericDiceSides
      .filter(n => Number.isInteger(n) && n >= 2)
      .forEach(n => {
        const opt = document.createElement('option');
        opt.value = String(n);
        opt.textContent = String(n);
        if (n === 6) opt.selected = true; // default D6
        select.appendChild(opt);
      });

    // Custom dal config
    Object.entries(this.customDiceTypes).forEach(([key, cfg]) => {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = (cfg && cfg.label) ? cfg.label : key;
      select.appendChild(opt);
    });
  }

  rebuildAllDiceColorSelects() {
    document.querySelectorAll('select.dice-color').forEach(sel => this.rebuildDiceColorSelect(sel));
  }

  rebuildDiceColorSelect(select) {
    while (select.firstChild) select.removeChild(select.firstChild);
    this.diceColors.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.value;
      opt.textContent = `${c.emoji || ''} ${c.label}`.trim();
      select.appendChild(opt);
    });
  }

  removeDiceRow(row) {
    if (this.diceRows.children.length > 1 && row) row.remove();
  }

  // ======= LOGICA DADI =======
  async rollAllDice() {
    const groups = this.diceRows.querySelectorAll('.dice-input-group');
    const results = [];

    groups.forEach(group => {
      const count = parseInt(group.querySelector('.dice-count').value, 10);
      const type = group.querySelector('.dice-type').value;
      const color = group.querySelector('.dice-color').value;

      const safeCount = Number.isFinite(count) ? Math.min(Math.max(count, 1), this.maxDicePerRow) : 1;

      for (let i = 0; i < safeCount; i++) {
        let value, sides;

        if (this.customDiceTypes[type]) {
          const cfg = this.customDiceTypes[type];
          const valuesArray = Array.isArray(cfg.values) ? cfg.values : [];
          if (valuesArray.length === 0) continue;
          const index = cryptoInt(valuesArray.length);
          value = valuesArray[index];
          sides = valuesArray.length;
          results.push({
            sides,
            color,
            value,
            type: 'custom',
            customType: type,
            displayName: cfg.displayName ?? type,
            emoji: cfg.emoji ?? ''
          });
        } else {
          sides = parseInt(type, 10);
          if (!Number.isInteger(sides) || sides < 2 || sides > 10000) continue;
          value = cryptoIntRange(1, sides);
          results.push({ sides, color, value, type: 'numeric' });
        }
      }
    });

    if (!results.length || !this.currentUser) return;

    const diceResult = {
      playerName: this.currentUser.name,
      playerId: this.currentUser.id,
      results,
      timestamp: firebase.database.ServerValue.TIMESTAMP,
      color: this.currentUser.color
    };

    try {
      await this.diceResultsRef.push(diceResult);
    } catch (e) {
      console.error('Errore push risultati:', e);
    }
  }

  // ======= CHAT =======
  async sendChatMessage() {
    const input = this.chatInput;
    if (!input) return;
    const text = (input.value || '').trim();
    if (!text) return;
    const message = {
      playerName: this.currentUser ? this.currentUser.name : 'Anon',
      playerId: this.currentUser ? this.currentUser.id : 'anon',
      color: this.currentUser ? this.currentUser.color : '#333',
      text,
      timestamp: firebase.database.ServerValue.TIMESTAMP
    };
    try {
      await this.chatRef.push(message);
      input.value = '';
    } catch (e) {
      console.error('Errore invio messaggio chat:', e);
    }
  }

  // ======= PRESENZA / CLEANUP =======
  async removeUserFromRoom() {
    if (!this.usersRef || !this.currentUser) return;
    try {
      this.usersRef.child(this.currentUser.id).remove().catch(e => console.error('Errore rimozione:', e));

      if (this.currentUser.color && this.roomRef) {
        const colorRef = this.roomRef.child('availableColors');
        colorRef.transaction(colors => {
          if (!Array.isArray(colors)) colors = [];
          if (!colors.includes(this.currentUser.color)) colors.push(this.currentUser.color);
          return colors;
        }).catch(e => console.error('Errore colore:', e));
      }

      localStorage.removeItem(`taverna_${this.currentRoom}_userId`);
      localStorage.removeItem(`taverna_${this.currentRoom}_userColor`);
    } catch (e) {
      console.error('Errore rimozione utente:', e);
    }
  }

  async cleanupDisconnectedUsers() {
    if (!this.usersRef) return;
    try {
      const snapshot = await this.usersRef.once('value');
      const users = snapshot.val() || {};
      const now = Date.now();
      const timeout = 24 * 60 * 60 * 1000;
      const disconnected = [];

      for (const [userId, user] of Object.entries(users)) {
        if (!user || userId === (this.currentUser && this.currentUser.id)) continue;
        const lastSeen = Number(user.lastSeen || 0);
        if (!Number.isFinite(lastSeen) || now - lastSeen > timeout) {
          disconnected.push({userId, color: user.color});
        }
      }

      if (disconnected.length === 0) return;

      for (const {userId, color} of disconnected) {
        this.usersRef.child(userId).remove().catch(e => console.error('Errore rimozione:', e));
        if (color && this.roomRef) {
          const colorRef = this.roomRef.child('availableColors');
          colorRef.transaction(colors => {
            if (!Array.isArray(colors)) colors = [];
            if (!colors.includes(color)) colors.push(color);
            return colors;
          }).catch(e => console.error('Errore colore:', e));
        }
      }
    } catch (e) {
      console.error('Errore pulizia utenti:', e);
    }
  }

  clearChat() {
    if (this.chatRef) {
      this.chatRef.remove().catch(e => console.error('Errore pulizia chat:', e));
    }
    this.chatMessages.innerHTML = '';
  }

  clearDiceResults() {
    if (this.diceResultsRef) {
      this.diceResultsRef.remove().catch(e => console.error('Errore pulizia dadi:', e));
    }
    this.diceResults.innerHTML = '';
  }

  initializeGdRSelector() {
    const games = getAvailableGames();
    this.gameSelect.innerHTML = '<option value="">Nessun GdR</option>';
    games.forEach(game => {
      const opt = document.createElement('option');
      opt.value = game.id;
      opt.textContent = game.name;
      this.gameSelect.appendChild(opt);
    });
    this.gameSelect.addEventListener('change', (e) => this.selectGame(e.target.value));
  }

  selectGame(gameId) {
    this.activeGameId = gameId;
    this.activePresetId = null;
    this.presetButtons.innerHTML = '';

    if (!gameId) return;

    const game = getGameById(gameId);
    if (!game || !game.presets) return;

    Object.entries(game.presets).forEach(([presetId, preset]) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'preset-btn';
      btn.textContent = `${preset.label} (${preset.dice})`;
      btn.addEventListener('click', () => this.rollPreset(gameId, presetId, preset.dice));
      this.presetButtons.appendChild(btn);
    });
  }

  async rollPreset(gameId, presetId, diceExpression) {
    const parsed = this.parseDiceExpression(diceExpression);
    if (!parsed) return;

    const diceResults = [];
    for (let i = 0; i < parsed.count; i++) {
      const value = cryptoIntRange(1, parsed.sides);
      diceResults.push({ sides: parsed.sides, value, type: 'numeric', highlight: false });
    }

    const roll = {
      gameId,
      presetId,
      diceExpression,
      dice: diceResults,
      tags: [],
      messages: [],
    };

    applyGameRules(gameId, roll);

    const results = roll.dice.map(d => ({
      sides: d.sides,
      value: d.value,
      type: 'numeric',
      color: this.diceColors[0]?.value || '#666',
      highlight: d.highlight,
    }));

    await this.sendDiceResult(results, roll.messages);
  }

  parseDiceExpression(expr) {
    const match = expr.match(/^(\d+)d(\d+)$/);
    if (!match) return null;
    return { count: parseInt(match[1], 10), sides: parseInt(match[2], 10) };
  }

  async sendDiceResult(results, messages = []) {
    if (!this.diceResultsRef || !this.currentUser) return;

    const resultObj = {
      playerName: this.currentUser.name,
      color: this.currentUser.color,
      results,
      timestamp: firebase.database.ServerValue.TIMESTAMP,
    };

    if (messages.length > 0) {
      resultObj.messages = messages;
    }

    await this.diceResultsRef.push(resultObj).catch(e => console.error('Errore invio risultato:', e));
  }

  // ======= HELPERS =======
  getColorEmoji(colorValue) {
    const found = this.diceColors.find(c => c.value === colorValue);
    return found?.emoji || '';
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ======= NAVIGAZIONE UI =======
  showLoginScreen() {
    this.loginScreen.classList.add('active');
    this.gameScreen.classList.remove('active');
  }
  showGameScreen() {
    this.loginScreen.classList.remove('active');
    this.gameScreen.classList.add('active');
  }
}

// Bootstrap "silenzioso"
document.addEventListener('DOMContentLoaded', () => {
  if (typeof firebase === 'undefined' || !window.database) {
    console.error('Firebase non caricato o non configurato.');
    return;
  }

  const app = new TavernaDeiCaniDiOdino();

  // Auto-reconnect se già salvato
  const savedPlayerName = sessionStorage.getItem('tavernaPlayerName');
  const savedRoomCode = APP_CONFIG.ROOM_NAME; // fisso
  if (savedPlayerName) {
    app.playerNameInput.value = savedPlayerName;
    app.roomCodeInput.value = savedRoomCode;
    setTimeout(() => app.joinRoom(), 200);
  }
});
