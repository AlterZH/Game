const Database = require('better-sqlite3');
const path = require('path');

// Инициализация базы данных
const dbPath = path.join(__dirname, 'game_data.db');
const db = new Database(dbPath);

// Создание таблиц
db.exec(`
  -- Таблица предметов (оружие, броня, еда, аксессуары)
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK(type IN ('weapon', 'armor', 'food', 'accessory')),
    description TEXT,
    shape_json TEXT NOT NULL,
    damage INTEGER DEFAULT 0,
    armor INTEGER DEFAULT 0,
    heal INTEGER DEFAULT 0,
    cooldown REAL DEFAULT 2.0,
    stamina_cost INTEGER DEFAULT 1,
    cost INTEGER NOT NULL DEFAULT 10,
    rarity TEXT DEFAULT 'common' CHECK(rarity IN ('common', 'rare', 'epic', 'legendary')),
    synergy_bonus REAL DEFAULT 0.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Таблица врагов
  CREATE TABLE IF NOT EXISTS enemies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    hp INTEGER NOT NULL,
    damage INTEGER NOT NULL,
    attack_speed REAL DEFAULT 1.0,
    difficulty INTEGER DEFAULT 1,
    reward_gold INTEGER DEFAULT 5,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Таблица синергий между предметами
  CREATE TABLE IF NOT EXISTS synergies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id_1 INTEGER NOT NULL,
    item_id_2 INTEGER NOT NULL,
    bonus_type TEXT NOT NULL,
    bonus_value REAL NOT NULL,
    description TEXT,
    FOREIGN KEY (item_id_1) REFERENCES items(id),
    FOREIGN KEY (item_id_2) REFERENCES items(id)
  );

  -- Таблица рецептов крафта
  CREATE TABLE IF NOT EXISTS crafting_recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    result_item_id INTEGER NOT NULL,
    ingredient_1_id INTEGER NOT NULL,
    ingredient_2_id INTEGER NOT NULL,
    FOREIGN KEY (result_item_id) REFERENCES items(id),
    FOREIGN KEY (ingredient_1_id) REFERENCES items(id),
    FOREIGN KEY (ingredient_2_id) REFERENCES items(id)
  );

  -- Таблица сохранений игрока
  CREATE TABLE IF NOT EXISTS player_saves (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    save_name TEXT NOT NULL UNIQUE,
    gold INTEGER DEFAULT 50,
    lives INTEGER DEFAULT 3,
    wins INTEGER DEFAULT 0,
    inventory_grid_size INTEGER DEFAULT 3,
    inventory_data TEXT,
    last_played DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Функция инициализации данных (заполнение начальными предметами)
function initializeGameData() {
  // Проверка, есть ли уже данные
  const count = db.prepare('SELECT COUNT(*) as count FROM items').get();
  if (count.count > 0) {
    console.log('База данных уже инициализирована.');
    return;
  }

  console.log('Инициализация базы данных...');

  // Вставка предметов
  const insertItem = db.prepare(`
    INSERT INTO items (name, type, description, shape_json, damage, armor, heal, cooldown, stamina_cost, cost, rarity, synergy_bonus)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const items = [
    // Оружие
    ['wooden_sword', 'weapon', 'Простой деревянный меч', '[[1,1]]', 5, 0, 0, 2.5, 1, 8, 'common', 0],
    ['steel_sword', 'weapon', 'Острый стальной меч', '[[1,1,1]]', 12, 0, 0, 2.0, 2, 20, 'rare', 0],
    ['battle_axe', 'weapon', 'Мощный боевой топор', '[[1,0],[1,1]]', 18, 0, 0, 3.0, 3, 35, 'epic', 0],
    ['dagger', 'weapon', 'Быстрый кинжал', '[[1]]', 3, 0, 0, 1.0, 1, 6, 'common', 0],
    ['magic_staff', 'weapon', 'Магический посох', '[[1,1,1,1]]', 15, 0, 0, 4.0, 2, 40, 'epic', 0],
    
    // Броня
    ['wooden_shield', 'armor', 'Деревянный щит', '[[1,1]]', 0, 8, 0, 0, 0, 10, 'common', 0],
    ['steel_armor', 'armor', 'Стальной нагрудник', '[[1,1],[1,1]]', 0, 20, 0, 0, 0, 30, 'rare', 0],
    ['helmet', 'armor', 'Боевой шлем', '[[1,1]]', 0, 5, 0, 0, 0, 12, 'common', 0],
    
    // Еда
    ['bread', 'food', 'Свежий хлеб', '[[1]]', 0, 0, 10, 0, 0, 5, 'common', 0],
    ['health_potion', 'food', 'Лечебное зелье', '[[1]]', 0, 0, 25, 0, 0, 15, 'rare', 0],
    
    // Аксессуары
    ['power_stone', 'accessory', 'Камень силы', '[[1]]', 0, 0, 0, 0, 0, 25, 'epic', 0.1],
    ['speed_boots', 'accessory', 'Сапоги скорости', '[[1]]', 0, 0, 0, 0, 0, 20, 'rare', 0.15],
    ['lucky_charm', 'accessory', 'Амулет удачи', '[[1]]', 0, 0, 0, 0, 0, 30, 'legendary', 0.2]
  ];

  const insertMany = db.transaction((items) => {
    for (const item of items) {
      insertItem.run(...item);
    }
  });

  insertMany(items);

  // Вставка врагов
  const insertEnemy = db.prepare(`
    INSERT INTO enemies (name, hp, damage, attack_speed, difficulty, reward_gold)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const enemies = [
    ['Goblin', 50, 5, 1.5, 1, 5],
    ['Orc', 100, 10, 1.2, 2, 10],
    ['Dark Knight', 200, 18, 1.0, 3, 20],
    ['Dragon', 500, 30, 0.8, 4, 50],
    ['Demon Lord', 1000, 50, 0.6, 5, 100]
  ];

  for (const enemy of enemies) {
    insertEnemy.run(...enemy);
  }

  // Вставка синергий
  const insertSynergy = db.prepare(`
    INSERT INTO synergies (item_id_1, item_id_2, bonus_type, bonus_value, description)
    VALUES ((SELECT id FROM items WHERE name = ?), (SELECT id FROM items WHERE name = ?), ?, ?, ?)
  `);

  const synergies = [
    ['steel_sword', 'power_stone', 'damage', 5, 'Стальной меч + Камень силы: +5 урона'],
    ['dagger', 'dagger', 'attack_speed', 0.2, 'Парные кинжалы: +20% скорость атаки'],
    ['magic_staff', 'power_stone', 'cooldown', -0.5, 'Посох + Камень силы: -0.5с КД'],
    ['wooden_shield', 'helmet', 'armor', 5, 'Щит + Шлем: +5 брони'],
    ['battle_axe', 'speed_boots', 'attack_speed', 0.3, 'Топор + Сапоги: +30% скорость атаки']
  ];

  for (const synergy of synergies) {
    try {
      insertSynergy.run(...synergy);
    } catch (e) {
      console.warn('Предмет для синергии не найден:', synergy[0], 'или', synergy[1]);
    }
  }

  // Вставка рецептов крафта
  const insertRecipe = db.prepare(`
    INSERT INTO crafting_recipes (result_item_id, ingredient_1_id, ingredient_2_id)
    VALUES ((SELECT id FROM items WHERE name = ?), (SELECT id FROM items WHERE name = ?), (SELECT id FROM items WHERE name = ?))
  `);

  const recipes = [
    ['steel_sword', 'wooden_sword', 'power_stone'],
    ['health_potion', 'bread', 'bread']
  ];

  for (const recipe of recipes) {
    try {
      insertRecipe.run(...recipe);
    } catch (e) {
      console.warn('Рецепт не создан:', recipe);
    }
  }

  console.log('База данных успешно инициализирована!');
}

// API функции для работы с данными
const api = {
  // Получить все предметы
  getAllItems() {
    return db.prepare('SELECT * FROM items ORDER BY cost').all();
  },

  // Получить предмет по ID
  getItemById(id) {
    return db.prepare('SELECT * FROM items WHERE id = ?').get(id);
  },

  // Получить случайные предметы для магазина
  getRandomItems(count = 5) {
    return db.prepare('SELECT * FROM items ORDER BY RANDOM() LIMIT ?').all(count);
  },

  // Получить врага по уровню сложности
  getEnemyByDifficulty(difficulty) {
    return db.prepare('SELECT * FROM enemies WHERE difficulty <= ? ORDER BY difficulty DESC LIMIT 1').get(difficulty);
  },

  // Получить все синергии для предмета
  getSynergiesForItem(itemId) {
    return db.prepare(`
      SELECT s.*, i1.name as item1_name, i2.name as item2_name
      FROM synergies s
      JOIN items i1 ON s.item_id_1 = i1.id
      JOIN items i2 ON s.item_id_2 = i2.id
      WHERE s.item_id_1 = ? OR s.item_id_2 = ?
    `).all(itemId, itemId);
  },

  // Проверить рецепт крафта
  checkCraftingRecipe(item1Id, item2Id) {
    return db.prepare(`
      SELECT r.*, i_result.name as result_name
      FROM crafting_recipes r
      JOIN items i_result ON r.result_item_id = i_result.id
      WHERE (r.ingredient_1_id = ? AND r.ingredient_2_id = ?)
         OR (r.ingredient_1_id = ? AND r.ingredient_2_id = ?)
    `).get(item1Id, item2Id, item2Id, item1Id);
  },

  // Сохранение прогресса игрока
  savePlayerProgress(saveName, gold, lives, wins, gridSize, inventoryData) {
    const upsert = db.prepare(`
      INSERT INTO player_saves (save_name, gold, lives, wins, inventory_grid_size, inventory_data, last_played)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(save_name) DO UPDATE SET
        gold = excluded.gold,
        lives = excluded.lives,
        wins = excluded.wins,
        inventory_grid_size = excluded.inventory_grid_size,
        inventory_data = excluded.inventory_data,
        last_played = CURRENT_TIMESTAMP
    `);
    upsert.run(saveName, gold, lives, wins, gridSize, JSON.stringify(inventoryData));
  },

  // Загрузка прогресса игрока
  loadPlayerProgress(saveName) {
    return db.prepare('SELECT * FROM player_saves WHERE save_name = ?').get(saveName);
  },

  // Получить статистику предметов
  getItemStats() {
    return db.prepare(`
      SELECT type, COUNT(*) as count, AVG(damage) as avg_damage, AVG(armor) as avg_armor
      FROM items
      GROUP BY type
    `).all();
  }
};

// Инициализация при загрузке модуля
initializeGameData();

module.exports = { db, api };
