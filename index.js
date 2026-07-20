const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const autoEat = require('mineflayer-auto-eat');
const settings = require('./settings.json');

let bot;

function createBot() {
  bot = mineflayer.createBot({
    host: settings.host,
    port: settings.port,
    username: settings.username,
    version: settings.version,
    auth: settings.auth
  });

  bot.loadPlugin(pathfinder);
  bot.loadPlugin(autoEat);

  bot.once('spawn', () => {
    console.log(`[BOT] Logged in as ${bot.username}`);
    const mcData = require('minecraft-data')(bot.version);
    const defaultMove = new Movements(bot, mcData);
    bot.pathfinder.setMovements(defaultMove);

    // Auto eat when hungry
    bot.autoEat.options = {
      priority: 'foodPoints',
      startAt: 14,
      bannedFood: []
    };

    startAntiAFK();
  });

  // Reconnect if kicked/disconnected
  bot.on('end', () => {
    console.log('[BOT] Disconnected. Reconnecting in 10s...');
    setTimeout(createBot, 10000);
  });

  bot.on('error', err => console.log('[ERROR]', err));
}

function randomAntiAFK() {
  const actions = [
    () => bot.swingArm(), // swing
    () => bot.chat('/afk'), // if server has /afk command
    () => {
      // small random movement
      const x = bot.entity.position.x + (Math.random() * 2 - 1);
      const z = bot.entity.position.z + (Math.random() * 2 - 1);
      bot.pathfinder.setGoal(new goals.GoalBlock(x, bot.entity.position.y, z));
    },
    () => bot.look(Math.random() * Math.PI * 2, Math.random() * Math.PI - 0.5), // look around
    () => bot.jump() // jump
  ];

  const action = actions[Math.floor(Math.random() * actions.length)];
  action();
  console.log('[ANTI-AFK] Did an action');
}

function startAntiAFK() {
  setInterval(randomAntiAFK, settings.antiAfkDelay);
}

createBot();
