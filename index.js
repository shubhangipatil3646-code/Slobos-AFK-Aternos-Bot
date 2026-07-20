const mineflayer = require('mineflayer');
const express = require('express');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const settings = require('./settings.json');

const app = express();
const MASTER_NAME = settings.masterName.toLowerCase(); // matches 'steven9539'

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

    // Global Message Scanner (Catches any chat formatting variations)
    bot.on('messagestr', (message, position) => {
        if (position === 'game_info') return; // Ignore action bars

        const rawMessage = message.toLowerCase();
        
        // Security check: Verify that your master name sent the message
        if (!rawMessage.includes(MASTER_NAME)) return;

        console.log(`Detected Master Message: ${message}`);

        // Extract commands even if wrapped in brackets or tags
        if (rawMessage.includes('come') || rawMessage.includes('follow')) {
            // Find the player object by checking partial name matches
            const targetPlayer = Object.keys(bot.players).find(p => p.toLowerCase().includes(MASTER_NAME));
            const targetEntity = bot.players[targetPlayer]?.entity;

            if (!targetEntity) {
                bot.chat("I cannot see you nearby, sir.");
                return;
            }

            bot.chat("Understood. Following your coordinates.");
            const goal = new goals.GoalFollow(targetEntity, 1);
            bot.pathfinder.setGoal(goal, true);
        }

        if (rawMessage.includes('stop')) {
            bot.chat("Stopping active tracking routines.");
            bot.pathfinder.setGoal(null);
        }
    });

    // Anti-AFK Head Matrix
    function executeHumanRoutine() {
        if (!bot || !bot.entity) return;
        
        if (!bot.pathfinder.isMoving()) {
            const yaw = (Math.random() * 360 - 180) * (Math.PI / 180);
            const pitch = (Math.random() * 60 - 30) * (Math.PI / 180);
            bot.look(yaw, pitch);
        }

        const nextDelay = Math.floor(Math.random() * 8000) + 4000;
        setTimeout(executeHumanRoutine, nextDelay);
    }

    bot.on('death', () => {
        setTimeout(() => {
            try { bot.respawn(); } catch (e) {}
        }, 3000);
    });

    bot.on('end', () => {
        console.log('Disconnected. Reconnecting in 10 seconds...');
        setTimeout(createBot, 10000);
    });

    bot.on('error', (err) => console.log('Bot Error:', err));
}

createBot();
