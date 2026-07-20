const mineflayer = require('mineflayer');
const express = require('express');
const { pathfinder, Movements } = require('mineflayer-pathfinder');
const settings = require('./settings.json');

const app = express();

// 24/7 Keep-Alive Server Layer for UptimeRobot
app.get('/', (req, res) => res.send('Worker Status: 24/7 Active.'));
app.listen(process.env.PORT || 3000, () => console.log('Render Port Bound Successfully.'));

let bot;

function createBot() {
    bot = mineflayer.createBot({
        host: settings.host,
        username: settings.username,
        port: settings.port,
        auth: settings.auth
    });

    bot.loadPlugin(pathfinder);

    // Bypass Geyser Resource Pack Prompts automatically
    bot._client.on('resource_pack_send', (packet) => {
        bot._client.write('resource_pack_receive', { uuid: packet.uuid, result: 2 });
        setTimeout(() => {
            bot._client.write('resource_pack_receive', { uuid: packet.uuid, result: 0 });
        }, 200);
    });

    bot.on('spawn', () => {
        console.log('Bot successfully spawned. Activating autonomous work routines...');
        const defaultMove = new Movements(bot);
        bot.pathfinder.setMovements(defaultMove);
        
        // Start the infinite loop of moving, breaking, and placing blocks
        setTimeout(executeAutonomousRoutine, 5000);
    });

    // Main Loop: Dictates independent, human-like activity
    async function executeAutonomousRoutine() {
        if (!bot || !bot.entity) return;

        try {
            // Action 1: Look around randomly
            const yaw = (Math.random() * 360 - 180) * (Math.PI / 180);
            const pitch = (Math.random() * 40 - 20) * (Math.PI / 180);
            await bot.look(yaw, pitch, true);

            // Action 2: Small random movements (Walk forward/backward/sideways)
            const actions = ['forward', 'back', 'left', 'right'];
            const randomAction = actions[Math.floor(Math.random() * actions.length)];
            
            bot.setControlState(randomAction, true);
            // Walk for 500 to 1500 milliseconds
            await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 1000) + 500));
            bot.setControlState(randomAction, false);

            // Action 3: Target a block in front of it and try to interact
            const blockInFront = bot.blockAtCursor(4); // Scans up to 4 blocks away
            
            if (blockInFront && blockInFront.name !== 'air_block' && blockInFront.name !== 'air') {
                // Randomly choose to either "mine" the block or place against it
                if (Math.random() > 0.5) {
                    // Simulate mining/breaking
                    bot.swingArm('right');
                    if (bot.canDigBlock(blockInFront)) {
                        console.log(`Mining block: ${blockInFront.name}`);
                        await bot.dig(blockInFront).catch(() => {});
                    }
                } else {
                    // Simulate placing a block if it holds items in its inventory
                    const items = bot.inventory.items();
                    if (items.length > 0) {
                        await bot.equip(items[0], 'hand').catch(() => {});
                        bot.swingArm('right');
                        await bot.placeBlock(blockInFront, { x: 0, y: 1, z: 0 }).catch(() => {});
                        console.log(`Attempted block placement against: ${blockInFront.name}`);
                    }
                }
            } else {
                // Just swing arm if looking at open air to look active
                bot.swingArm('right');
            }

        } catch (err) {
            console.log('Routine step bypassed due to restriction:', err.message);
        }

        // Loop interval: Run next action bundle in 4 to 9 seconds
        const nextLoopDelay = Math.floor(Math.random() * 5000) + 4000;
        setTimeout(executeAutonomousRoutine, nextLoopDelay);
    }

    // Auto-Respawn Protocol
    bot.on('death', () => {
        console.log('Bot perished. Forcing immediate server respawn handling...');
        setTimeout(() => {
            try { bot.respawn(); } catch (e) {}
        }, 2000);
    });

    // Auto-Reconnect Logic (Ensures 24/7 stability if kicked or server restarts)
    bot.on('end', () => {
        console.log('Server connection lost. Initializing reconnect queue in 15 seconds...');
        setTimeout(createBot, 15000);
    });

    bot.on('error', (err) => console.log('Internal Bot Error Logged:', err));
}

createBot();
