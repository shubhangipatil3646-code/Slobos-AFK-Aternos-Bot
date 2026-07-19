const mineflayer = require('mineflayer');
const express = require('express');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const settings = require('./settings.json');

const app = express();
const MASTER_NAME = settings.masterName.toLowerCase();

// Keep Render alive
app.get('/', (req, res) => res.send('JARVIS Matrix: Fully operational.'));
app.listen(process.env.PORT || 3000, () => console.log('Render Port Online.'));

let bot;

function createBot() {
    bot = mineflayer.createBot({
        host: settings.host,
        username: settings.username,
        port: settings.port,
        auth: settings.auth
    });

    bot.loadPlugin(pathfinder);

    // Auto-accept Geyser resource packs
    bot._client.on('resource_pack_send', (packet) => {
        bot._client.write('resource_pack_receive', { uuid: packet.uuid, result: 2 });
        setTimeout(() => {
            bot._client.write('resource_pack_receive', { uuid: packet.uuid, result: 0 });
        }, 200);
    });

    bot.on('spawn', () => {
        console.log('JARVIS Systems Activated. Running anti-AFK sequences.');
        const defaultMove = new Movements(bot);
        bot.pathfinder.setMovements(defaultMove);
        executeHumanRoutine();
    });

    // Chat Command Logic (Fixed for Geyser/Floodgate prefixes)
    bot.on('chat', (username, message) => {
        // Clean Geyser/Floodgate prefix (e.g., "*Sujay" becomes "sujay")
        const cleanUsername = username.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
        
        if (cleanUsername !== MASTER_NAME) return;

        const command = message.toLowerCase().trim();

        if (command === 'come' || command === 'follow') {
            const target = bot.players[username]?.entity;
            if (!target) {
                bot.chat("I cannot see you, sir.");
                return;
            }
            bot.chat("Understood. Following you now.");
            const goal = new goals.GoalFollow(target, 1);
            bot.pathfinder.setGoal(goal, true);
        } 
        
        if (command === 'stop') {
            bot.chat("Stopping routines.");
            bot.pathfinder.setGoal(null);
        }
    });

    // Anti-AFK Human Mimic Loop
    function executeHumanRoutine() {
        if (!bot || !bot.entity) return;
        
        // Only look around if not actively pathfinding/following
        if (!bot.pathfinder.isMoving()) {
            const yaw = (Math.random() * 360 - 180) * (Math.PI / 180);
            const pitch = (Math.random() * 60 - 30) * (Math.PI / 180);
            bot.look(yaw, pitch);
        }

        const nextDelay = Math.floor(Math.random() * 8000) + 4000; // 4-12 seconds
        setTimeout(executeHumanRoutine, nextDelay);
    }

    // Auto-Respawn
    bot.on('death', () => {
        console.log('Bot died. Initializing respawn protocol...');
        setTimeout(() => {
            try { bot.respawn(); } catch (e) {}
        }, 3000);
    });

    // Auto-Reconnect on kick/error
    bot.on('end', () => {
        console.log('Disconnected. Reconnecting in 10 seconds...');
        setTimeout(createBot, 10000);
    });

    bot.on('error', (err) => console.log('Bot Error:', err));
}

createBot();
