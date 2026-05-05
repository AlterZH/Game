const express = require('express');
const cors = require('cors');
const path = require('path');
const { api } = require('./database');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// API endpoints

// Получить все предметы
app.get('/api/items', (req, res) => {
  try {
    const items = api.getAllItems();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить случайные предметы для магазина
app.get('/api/items/random', (req, res) => {
  try {
    const count = parseInt(req.query.count) || 5;
    const items = api.getRandomItems(count);
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить предмет по ID
app.get('/api/items/:id', (req, res) => {
  try {
    const item = api.getItemById(parseInt(req.params.id));
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить врага по уровню сложности
app.get('/api/enemies/:difficulty', (req, res) => {
  try {
    const enemy = api.getEnemyByDifficulty(parseInt(req.params.difficulty));
    if (!enemy) {
      return res.status(404).json({ error: 'Enemy not found' });
    }
    res.json(enemy);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить синергии для предмета
app.get('/api/synergies/:itemId', (req, res) => {
  try {
    const synergies = api.getSynergiesForItem(parseInt(req.params.itemId));
    res.json(synergies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Проверить рецепт крафта
app.post('/api/crafting/check', (req, res) => {
  try {
    const { item1Id, item2Id } = req.body;
    const recipe = api.checkCraftingRecipe(item1Id, item2Id);
    res.json(recipe || null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Сохранить прогресс игрока
app.post('/api/save', (req, res) => {
  try {
    const { saveName, gold, lives, wins, gridSize, inventoryData } = req.body;
    api.savePlayerProgress(saveName, gold, lives, wins, gridSize, inventoryData);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Загрузить прогресс игрока
app.get('/api/save/:saveName', (req, res) => {
  try {
    const save = api.loadPlayerProgress(req.params.saveName);
    if (!save) {
      return res.status(404).json({ error: 'Save not found' });
    }
    res.json(save);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить статистику предметов
app.get('/api/stats', (req, res) => {
  try {
    const stats = api.getItemStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log('API endpoints available:');
  console.log(`  GET  /api/items - Все предметы`);
  console.log(`  GET  /api/items/random?count=5 - Случайные предметы`);
  console.log(`  GET  /api/items/:id - Предмет по ID`);
  console.log(`  GET  /api/enemies/:difficulty - Враг по сложности`);
  console.log(`  GET  /api/synergies/:itemId - Синергии предмета`);
  console.log(`  POST /api/crafting/check - Проверка рецепта`);
  console.log(`  POST /api/save - Сохранение прогресса`);
  console.log(`  GET  /api/save/:name - Загрузка прогресса`);
  console.log(`  GET  /api/stats - Статистика предметов`);
});
