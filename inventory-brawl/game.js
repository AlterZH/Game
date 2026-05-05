// INVENTORY CHAOS - Auto Battler Game

const ITEM_TYPES = {
    wooden_sword: { id: 'wooden_sword', name: 'Деревянный меч', icon: '🗡️', type: 'weapon', shape: [[1, 1]], damage: 8, cooldown: 2.0, staminaCost: 1, price: 15, description: 'Базовое оружие новичка' },
    dagger: { id: 'dagger', name: 'Кинжал', icon: '🔪', type: 'weapon', shape: [[1]], damage: 5, cooldown: 1.2, staminaCost: 0.5, price: 10, description: 'Быстрое, но слабое оружие' },
    shield: { id: 'shield', name: 'Щит', icon: '🛡️', type: 'armor', shape: [[1, 1]], damage: 2, cooldown: 3.0, staminaCost: 1.5, armor: 5, price: 20, description: 'Защищает от атак врага' },
    steel_sword: { id: 'steel_sword', name: 'Стальной меч', icon: '⚔️', type: 'weapon', shape: [[1, 1, 1]], damage: 15, cooldown: 2.5, staminaCost: 2, price: 35, description: 'Мощное оружие из стали' },
    health_potion: { id: 'health_potion', name: 'Зелье здоровья', icon: '🧪', type: 'consumable', shape: [[1]], heal: 15, cooldown: 4.0, staminaCost: 0, price: 12, description: 'Восстанавливает здоровье в бою' },
    power_stone: { id: 'power_stone', name: 'Камень силы', icon: '💎', type: 'accessory', shape: [[1]], damage: 3, cooldown: 1.5, staminaCost: 0.3, price: 25, description: 'Усиливает соседние предметы' },
    poison_vial: { id: 'poison_vial', name: 'Яд', icon: '☠️', type: 'consumable', shape: [[1]], damage: 4, cooldown: 1.0, staminaCost: 0.2, poisonDamage: 2, poisonDuration: 3, price: 18, description: 'Отравляет врага' },
    helmet: { id: 'helmet', name: 'Шлем', icon: '🪖', type: 'armor', shape: [[1, 1]], damage: 1, cooldown: 2.0, staminaCost: 0.5, armor: 8, price: 22, description: 'Защищает голову' },
    chestplate: { id: 'chestplate', name: 'Нагрудник', icon: '🦾', type: 'armor', shape: [[1, 1], [1, 1]], damage: 3, cooldown: 3.5, staminaCost: 2, armor: 12, price: 40, description: 'Тяжелая броня для тела' },
    food: { id: 'food', name: 'Еда', icon: '🍖', type: 'consumable', shape: [[1]], heal: 8, cooldown: 3.0, staminaCost: 0, staminaRestore: 2, price: 8, description: 'Восстанавливает здоровье и выносливость' }
};

function countAdjacent(grid, row, col, types) {
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    let count = 0;
    for (const [dr, dc] of directions) {
        const nr = row + dr, nc = col + dc;
        if (nr >= 0 && nr < grid.rows && nc >= 0 && nc < grid.cols) {
            const cell = grid.getCell(nr, nc);
            if (cell && types.includes(cell.item.id)) count++;
        }
    }
    return count;
}

function getAdjacentItems(grid, row, col) {
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    const items = [];
    for (const [dr, dc] of directions) {
        const nr = row + dr, nc = col + dc;
        if (nr >= 0 && nr < grid.rows && nc >= 0 && nc < grid.cols) {
            const cell = grid.getCell(nr, nc);
            if (cell) items.push(cell.item);
        }
    }
    return items;
}

class GridManager {
    constructor(rows, cols) { this.rows = rows; this.cols = cols; this.cells = []; this.initializeGrid(); }
    initializeGrid() { this.cells = []; for (let r = 0; r < this.rows; r++) { this.cells[r] = []; for (let c = 0; c < this.cols; c++) this.cells[r][c] = null; } }
    getCell(row, col) { return (row >= 0 && row < this.rows && col >= 0 && col < this.cols) ? this.cells[row][col] : null; }
    canPlaceItem(item, startRow, startCol, rotation = 0) {
        const shape = this.getRotatedShape(item.shape, rotation);
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c] === 1) {
                    const gr = startRow + r, gc = startCol + c;
                    if (gr < 0 || gr >= this.rows || gc < 0 || gc >= this.cols || this.cells[gr][gc] !== null) return false;
                }
            }
        }
        return true;
    }
    placeItem(item, row, col, rotation = 0) {
        if (!this.canPlaceItem(item, row, col, rotation)) return false;
        const shape = this.getRotatedShape(item.shape, rotation);
        for (let r = 0; r < shape.length; r++) for (let c = 0; c < shape[r].length; c++) if (shape[r][c] === 1) this.cells[row + r][col + c] = { item, rotation, baseRow: row, baseCol: col };
        return { success: true };
    }
    removeItem(row, col) {
        const cell = this.cells[row][col];
        if (!cell) return false;
        const item = cell.item, shape = this.getRotatedShape(item.shape, cell.rotation);
        for (let r = 0; r < shape.length; r++) for (let c = 0; c < shape[r].length; c++) if (shape[r][c] === 1) this.cells[cell.baseRow + r][cell.baseCol + c] = null;
        return item;
    }
    getRotatedShape(shape, rotation) {
        let result = shape.map(row => [...row]);
        for (let i = 0; i < rotation; i++) {
            const rows = result.length, cols = result[0].length, newShape = [];
            for (let c = 0; c < cols; c++) { newShape[c] = []; for (let r = rows - 1; r >= 0; r--) newShape[c].push(result[r][c]); }
            result = newShape;
        }
        return result;
    }
    getAllItems() {
        const items = [], visited = new Set();
        for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) {
            const cell = this.cells[r][c];
            if (cell && !visited.has(`${cell.baseRow}-${cell.baseCol}`)) { visited.add(`${cell.baseRow}-${cell.baseCol}`); items.push({ item: cell.item, row: cell.baseRow, col: cell.baseCol, rotation: cell.rotation }); }
        }
        return items;
    }
    resize(newRows, newCols) {
        const newCells = [];
        for (let r = 0; r < newRows; r++) { newCells[r] = []; for (let c = 0; c < newCols; c++) newCells[r][c] = (r < this.rows && c < this.cols) ? this.cells[r][c] : null; }
        this.rows = newRows; this.cols = newCols; this.cells = newCells;
    }
}

class CombatEngine {
    constructor(heroGrid, enemyStats) {
        this.heroGrid = heroGrid;
        this.enemy = { ...enemyStats, maxHp: enemyStats.hp };
        this.hero = { hp: 100, maxHp: 100, stamina: 100, maxStamina: 100, armor: 0 };
        this.heroItems = []; this.time = 0; this.logs = []; this.isRunning = false; this.result = null;
    }
    start() {
        this.isRunning = true; this.time = 0; this.logs = []; this.result = null;
        this.heroItems = this.heroGrid.getAllItems().map(({ item, row, col, rotation }) => ({ ...item, ...this.calculateItemStats(item, row, col), currentCooldown: 0, row, col, rotation }));
        this.log('Бой начался!', 'info');
    }
    calculateItemStats(item, row, col) {
        let stats = { damage: item.damage || 0, armor: item.armor || 0, heal: item.heal || 0 };
        if (item.id === 'wooden_sword') stats.damage += countAdjacent(this.heroGrid, row, col, ['dagger']) * 2;
        if (item.id === 'dagger') stats.cooldownMult = 1 - (countAdjacent(this.heroGrid, row, col, ['dagger']) * 0.05);
        if (item.id === 'shield') stats.armor += countAdjacent(this.heroGrid, row, col, ['wooden_sword', 'dagger', 'steel_sword']) * 2;
        if (item.id === 'steel_sword') stats.damage += countAdjacent(this.heroGrid, row, col, ['shield']) * 3;
        if (item.id === 'health_potion') stats.heal += countAdjacent(this.heroGrid, row, col, ['health_potion']) * 5;
        if (item.id === 'helmet') stats.armor += countAdjacent(this.heroGrid, row, col, ['shield', 'helmet', 'chestplate']);
        if (item.id === 'chestplate') stats.armor += Math.floor(countAdjacent(this.heroGrid, row, col, ['shield', 'helmet', 'chestplate']) / 2) * 3;
        const powerStoneCount = getAdjacentItems(this.heroGrid, row, col).filter(i => i.id === 'power_stone').length;
        if (powerStoneCount > 0) stats.damageMult = (stats.damageMult || 1) + (powerStoneCount * 0.15);
        return stats;
    }
    update(deltaTime) {
        if (!this.isRunning) return;
        this.time += deltaTime;
        this.hero.stamina = Math.min(this.hero.maxStamina, this.hero.stamina + deltaTime * 2);
        for (const item of this.heroItems) {
            item.currentCooldown -= deltaTime;
            if (item.currentCooldown <= 0) {
                const staminaCost = item.staminaCost || 0;
                if (this.hero.stamina >= staminaCost) { this.hero.stamina -= staminaCost; this.executeItemAction(item); item.currentCooldown = item.cooldown * (item.cooldownMult || 1); }
                else item.currentCooldown = item.cooldown * 1.5;
            }
        }
        if (Math.floor(this.time * 10) % 20 === 0 && Math.random() < deltaTime) this.enemyAttack();
        if (this.enemy.hp <= 0) this.endCombat(true);
        else if (this.hero.hp <= 0) this.endCombat(false);
    }
    executeItemAction(item) {
        if (item.damage && item.damage > 0) { const dmg = Math.floor(item.damage * (item.damageMult || 1)); this.enemy.hp = Math.max(0, this.enemy.hp - dmg); this.log(`${item.icon} ${item.name}: ${dmg} урона`, 'damage'); }
        if (item.heal && item.heal > 0) { const oldHp = this.hero.hp; this.hero.hp = Math.min(this.hero.maxHp, this.hero.hp + item.heal); const healed = this.hero.hp - oldHp; if (healed > 0) this.log(`${item.icon} +${healed} HP`, 'heal'); }
        if (item.poisonDamage) { const poisonTotal = item.poisonDamage * (item.poisonDuration || 1); this.enemy.hp = Math.max(0, this.enemy.hp - poisonTotal); this.log(`${item.icon} Яд: ${poisonTotal} урона`, 'damage'); }
    }
    enemyAttack() { const baseDamage = this.enemy.damage || 5; const dmg = Math.max(1, baseDamage - Math.floor(this.hero.armor / 2)); this.hero.hp = Math.max(0, this.hero.hp - dmg); this.log(`Враг: ${dmg} урона`, 'damage'); }
    endCombat(victory) { this.isRunning = false; this.result = victory ? 'victory' : 'defeat'; this.log(victory ? '🎉 ПОБЕДА!' : '💀 ПОРАЖЕНИЕ...', victory ? 'heal' : 'damage'); }
    log(message, type = 'info') { this.logs.push({ message, type, time: this.time }); }
    getLogs() { return this.logs; }
}

class Game {
    constructor() { this.app = null; this.grid = null; this.shopItems = []; this.gold = 100; this.lives = 3; this.wins = 0; this.round = 1; this.phase = 'shop'; this.combatEngine = null; this.draggedItem = null; this.draggedItemRotation = 0; this.init(); }
    async init() {
        this.app = new PIXI.Application({ width: window.innerWidth, height: window.innerHeight, backgroundColor: 0x1a1a2e, resolution: window.devicePixelRatio || 1, autoDensity: true });
        document.getElementById('game-canvas').appendChild(this.app.view);
        this.grid = new GridManager(3, 3);
        this.setupUI(); this.generateShop(); this.updateUI();
        this.app.ticker.add((delta) => this.gameLoop(delta));
        window.addEventListener('resize', () => this.handleResize());
    }
    setupUI() {
        document.getElementById('reroll-btn').addEventListener('click', () => this.rerollShop());
        document.getElementById('expand-btn').addEventListener('click', () => this.expandGrid());
        document.getElementById('start-combat-btn').addEventListener('click', () => this.startCombat());
        document.getElementById('next-round-btn').addEventListener('click', () => this.nextRound());
        document.addEventListener('keydown', (e) => { if (e.code === 'Space' && this.draggedItem) this.draggedItemRotation = (this.draggedItemRotation + 1) % 4; if (e.code === 'Escape' && this.draggedItem) this.cancelDrag(); });
    }
    generateShop() { this.shopItems = []; const keys = Object.keys(ITEM_TYPES); for (let i = 0; i < 5; i++) this.shopItems.push({ ...ITEM_TYPES[keys[Math.floor(Math.random() * keys.length)]], uid: Date.now() + i }); this.renderShop(); }
    rerollShop() { if (this.gold >= 1) { this.gold--; this.generateShop(); this.updateUI(); } }
    renderShop() {
        const container = document.getElementById('shop-items'); container.innerHTML = '';
        this.shopItems.forEach((item, index) => {
            const el = document.createElement('div'); el.className = 'item-slot'; el.textContent = item.icon; el.title = `${item.name}\n${item.description}\nЦена: ${item.price}💰`; el.style.background = this.getItemColor(item.type);
            el.addEventListener('click', () => this.buyItem(index));
            el.addEventListener('mouseenter', (e) => this.showTooltip(e, item));
            el.addEventListener('mouseleave', () => this.hideTooltip());
            container.appendChild(el);
        });
    }
    getItemColor(type) { const colors = { weapon: 'linear-gradient(135deg, #ff6b6b, #ee5a5a)', armor: 'linear-gradient(135deg, #4ecdc4, #44a0b8)', consumable: 'linear-gradient(135deg, #ffeaa7, #fdcb6e)', accessory: 'linear-gradient(135deg, #a29bfe, #6c5ce7)' }; return colors[type] || colors.weapon; }
    buyItem(index) { const item = this.shopItems[index]; if (this.gold < item.price) { alert('Недостаточно золота!'); return; } this.draggedItem = item; this.draggedItemRotation = 0; this.shopItems.splice(index, 1); this.renderShop(); }
    renderInventory() {
        const container = document.getElementById('inventory-grid'); container.innerHTML = ''; container.style.gridTemplateColumns = `repeat(${this.grid.cols}, 50px)`;
        for (let r = 0; r < this.grid.rows; r++) {
            for (let c = 0; c < this.grid.cols; c++) {
                const cell = document.createElement('div'); cell.className = 'grid-cell';
                const gridCell = this.grid.getCell(r, c);
                if (gridCell) { cell.classList.add('occupied'); if (gridCell.baseRow === r && gridCell.baseCol === c) { const itemEl = document.createElement('div'); itemEl.className = 'item-slot'; itemEl.textContent = gridCell.item.icon; itemEl.style.background = this.getItemColor(gridCell.item.type); itemEl.draggable = true; itemEl.addEventListener('dragstart', (e) => this.handleDragStart(e, r, c)); itemEl.addEventListener('mouseenter', (e) => this.showTooltip(e, gridCell.item)); itemEl.addEventListener('mouseleave', () => this.hideTooltip()); cell.appendChild(itemEl); } }
                cell.addEventListener('dragover', (e) => e.preventDefault()); cell.addEventListener('dragenter', () => cell.classList.add('drag-over')); cell.addEventListener('dragleave', () => cell.classList.remove('drag-over')); cell.addEventListener('drop', (e) => this.handleDrop(e, r, c)); cell.addEventListener('click', () => this.handleCellClick(r, c));
                container.appendChild(cell);
            }
        }
    }
    handleDragStart(e, row, col) { const item = this.grid.removeItem(row, col); if (item) { this.draggedItem = item; this.draggedItemRotation = 0; this.renderInventory(); } }
    handleDrop(e, row, col) { e.preventDefault(); if (this.draggedItem) { const result = this.grid.placeItem(this.draggedItem, row, col, this.draggedItemRotation); if (result && result.success) { this.draggedItem = null; this.draggedItemRotation = 0; this.renderInventory(); } else { alert('Нельзя разместить здесь!'); this.draggedItem = null; } } document.querySelectorAll('.grid-cell').forEach(c => c.classList.remove('drag-over')); }
    handleCellClick(row, col) { if (this.draggedItem) { const result = this.grid.placeItem(this.draggedItem, row, col, this.draggedItemRotation); if (result && result.success) { this.draggedItem = null; this.draggedItemRotation = 0; this.renderInventory(); } } }
    cancelDrag() { if (this.draggedItem) { this.shopItems.push(this.draggedItem); this.draggedItem = null; this.renderShop(); this.renderInventory(); } }
    expandGrid() { const cost = 50 * Math.max(1, (this.grid.rows - 2)); if (this.gold >= cost) { if (this.grid.rows < 6 && this.grid.cols < 6) { this.gold -= cost; if (this.grid.rows <= this.grid.cols) this.grid.resize(this.grid.rows + 1, this.grid.cols); else this.grid.resize(this.grid.rows, this.grid.cols + 1); this.renderInventory(); this.updateUI(); } else alert('Максимальный размер достигнут!'); } else alert(`Нужно ${cost}💰`); }
    startCombat() { if (this.grid.getAllItems().length === 0) { alert('Разместите предметы в инвентаре!'); return; } this.phase = 'combat'; this.combatEngine = new CombatEngine(this.grid, { hp: 50 + (this.round * 30), damage: 5 + (this.round * 2) }); this.combatEngine.start(); document.getElementById('combat-panel').classList.remove('hidden'); document.getElementById('start-combat-btn').classList.add('hidden'); document.getElementById('phase-text').textContent = '⚔️ БОЙ!'; this.updateCombatUI(); }
    gameLoop(delta) { if (this.phase === 'combat' && this.combatEngine && this.combatEngine.isRunning) { this.combatEngine.update(delta / 60); this.updateCombatUI(); if (!this.combatEngine.isRunning) this.endCombat(); } }
    updateCombatUI() { if (!this.combatEngine) return; document.getElementById('hero-hp-bar').style.width = `${Math.max(0, (this.combatEngine.hero.hp / this.combatEngine.hero.maxHp) * 100)}%`; document.getElementById('enemy-hp-bar').style.width = `${Math.max(0, (this.combatEngine.enemy.hp / this.combatEngine.enemy.maxHp) * 100)}%`; document.getElementById('hero-hp-text').textContent = `${Math.ceil(this.combatEngine.hero.hp)}/${this.combatEngine.hero.maxHp}`; document.getElementById('enemy-hp-text').textContent = `${Math.ceil(this.combatEngine.enemy.hp)}/${this.combatEngine.enemy.maxHp}`; const logs = this.combatEngine.getLogs(); document.getElementById('combat-log').innerHTML = logs.slice(-10).map(l => `<div class="log-entry ${l.type}">[${l.time.toFixed(1)}s] ${l.message}</div>`).join(''); document.getElementById('combat-log').scrollTop = document.getElementById('combat-log').scrollHeight; }
    endCombat() { const victory = this.combatEngine.result === 'victory'; if (victory) { this.wins++; this.gold += 20 + (this.round * 5); } else this.lives--; this.phase = 'result'; document.getElementById('next-round-btn').classList.remove('hidden'); document.getElementById('phase-text').textContent = victory ? '🏆 Победа!' : '💀 Поражение...'; this.updateUI(); if (this.lives <= 0) setTimeout(() => { alert(`Игра окончена! Побед: ${this.wins}`); this.resetGame(); }, 1000); if (this.wins >= 10) setTimeout(() => { alert('🎉 Вы прошли игру!'); this.resetGame(); }, 1000); }
    nextRound() { this.round++; this.phase = 'shop'; document.getElementById('combat-panel').classList.add('hidden'); document.getElementById('next-round-btn').classList.add('hidden'); document.getElementById('start-combat-btn').classList.remove('hidden'); document.getElementById('phase-text').textContent = '🛒 Фаза Магазина'; this.generateShop(); this.updateUI(); }
    resetGame() { this.gold = 100; this.lives = 3; this.wins = 0; this.round = 1; this.grid = new GridManager(3, 3); this.generateShop(); this.renderInventory(); this.updateUI(); this.phase = 'shop'; document.getElementById('phase-text').textContent = '🛒 Фаза Магазина'; }
    updateUI() { document.getElementById('gold-display').textContent = this.gold; document.getElementById('lives-display').textContent = '❤️'.repeat(this.lives); document.getElementById('wins-display').textContent = `${this.wins}/10`; document.getElementById('round-display').textContent = this.round; document.getElementById('grid-size').textContent = `(${this.grid.rows}x${this.grid.cols})`; }
    showTooltip(e, item) { const tooltip = document.getElementById('item-tooltip'); document.getElementById('tooltip-name').textContent = `${item.icon} ${item.name}`; document.getElementById('tooltip-desc').textContent = item.description; document.getElementById('tooltip-stats').textContent = `Урон: ${item.damage||0} | КД: ${item.cooldown||0}s | Цена: ${item.price}💰`; document.getElementById('tooltip-synergy').textContent = this.getItemSynergies(item); tooltip.classList.remove('hidden'); tooltip.style.left = `${e.clientX + 15}px`; tooltip.style.top = `${e.clientY + 15}px`; }
    hideTooltip() { document.getElementById('item-tooltip').classList.add('hidden'); }
    getItemSynergies(item) { const syn = { 'wooden_sword': '+2 урона за каждый соседний кинжал', 'dagger': '-5% КД за каждый соседний кинжал', 'shield': '+2 брони за каждое соседнее оружие', 'steel_sword': '+3 урона за каждый соседний щит', 'power_stone': '+15% урона всем соседям', 'health_potion': '+5 лечения за каждое соседнее зелье', 'helmet': '+1 броня за каждую соседнюю броню', 'chestplate': '+3 брони за каждые 2 соседних брони' }; return 'Синергия: ' + (syn[item.id] || 'Уникальные бонусы'); }
    handleResize() { this.app.renderer.resize(window.innerWidth, window.innerHeight); }
}

window.addEventListener('load', () => { window.game = new Game(); });
