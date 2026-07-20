const mineflayer = require('mineflayer');
const express = require('express');
const { pathfinder, Movements } = require('mineflayer-pathfinder');

// --- SERVER SETUP CONFIGURATION ---
const CONFIG = {
    host: "sujay4444.aternos.me",
    username: "ULTRON_AFK",
    port: 25565, // Standard Java Port for GeyserMC conversion
    auth: "offline",
    masterName: "stevenn9539" // Your exact username
};

const app = express();
let bot;

// 24/7 Web Dashboard Connection layer for UptimeRobot pings
app.get('/', (req, res) => res.send('Ultron Anti-AFK Matrix: Active.'));
app.listen(process.env.PORT || 3000, () => console.log('[System]: Render web portal active.'));

function launchBot() {
    bot = mineflayer.createBot({
        host: CONFIG.host,
        username: CONFIG.username,
        port: CONFIG.port,
        auth: CONFIG.auth
    });

    bot.loadPlugin(pathfinder);

    // Bypass Geyser/Floodgate resource pack prompt freezes automatically
    bot._client.on('resource_pack_send', (packet) => {
        bot._client.write('resource_pack_receive', { uuid: packet.uuid, result: 2 });
        setTimeout(() => {
            bot._client.write('resource_pack_receive', { uuid: packet.uuid, result: 0 });
        }, 250);
    });

    bot.on('spawn', () => {
        console.log('[System]: Bot spawned. Initiating advanced anti-AFK routines...');
        const movements = new Movements(bot);
        movements.canDig = true; // Allows the bot to mine blocks cleanly
        bot.pathfinder.setMovements(movements);

        // Kick off the infinite, loop-driven automated workflow
        setTimeout(executeAntiAFKLoop, 3000);
    });

    // Auto-Respawn Protocol if killed by monsters/players
    bot.on('death', () => {
        console.log('[System]: Bot died. Re-initializing mainframe profile...');
        setTimeout(() => { try { bot.respawn(); } catch(e){} }, 2000);
    });

    // Infinite Auto-Reconnect Queue if server restarts or kicks the bot
    bot.on('end', () => {
        console.log('[System]: Connection lost. Re-establishing link in 15 seconds...');
        setTimeout(launchBot, 15000);
    });

    bot.on('error', (err) => console.log(`[Error]: Framework warning: ${err.message}`));
}

// --- MASTER ANTI-AFK MATRIX ENGINE ---
async function executeAntiAFKLoop() {
    if (!bot || !bot.entity) return;

    try {
        // Roll a dice to decide which human action group to execute
        const randomRoll = Math.random();

        if (randomRoll < 0.25) {
            // ACTION 1: Sneak & Natural Head Movements
            bot.setControlState('sneak', true);
            const yaw = (Math.random() * 360 - 180) * (Math.PI / 180);
            const pitch = (Math.random() * 40 - 20) * (Math.PI / 180);
            await bot.look(yaw, pitch, true);
            await new Promise(r => setTimeout(r, 1500));
            bot.setControlState('sneak', false);

        } else if (randomRoll < 0.50) {
            // ACTION 2: Physical Spatial Displacement (Random Movement & Jumping)
            const moves = ['forward', 'back', 'left', 'right'];
            const targetMove = moves[Math.floor(Math.random() * moves.length)];
            
            bot.setControlState(targetMove, true);
            if (Math.random() > 0.5) bot.setControlState('jump', true); // Jump mid-walk
            
            await new Promise(r => setTimeout(r, Math.floor(Math.random() * 1000) + 500));
            
            bot.setControlState(targetMove, false);
            bot.setControlState('jump', false);

        } else if (randomRoll < 0.75) {
            // ACTION 3: Target block and interact (Mine or Place)
            const targetedBlock = bot.blockAtCursor(4); // Scans up to 4 blocks away
            
            if (targetedBlock && targetedBlock.name !== 'air' && targetedBlock.name !== 'cave_air') {
                bot.swingArm('right');
                if (Math.random() > 0.4 && bot.canDigBlock(targetedBlock)) {
                    console.log(`[Action]: Mining ${targetedBlock.name}`);
                    await bot.dig(targetedBlock).catch(() => {});
                } else {
                    // Try to place a block back down if items exist in inventory
                    const inventoryItems = bot.inventory.items();
                    if (inventoryItems.length > 0) {
                        await bot.equip(inventoryItems[0], 'hand').catch(() => {});
                        await bot.placeBlock(targetedBlock, { x: 0, y: 1, z: 0 }).catch(() => {});
                        console.log(`[Action]: Placed block against ${targetedBlock.name}`);
                    }
                }
            } else {
                bot.swingArm('right'); // Swing into air to simulate combat/activity
            }

        } else {
            // ACTION 4: Inventory Maintenance (Equip/Toss items to prevent server inventory clutter)
            const currentItems = bot.inventory.items();
            if (currentItems.length > 5) {
                console.log('[Action]: Inventory full. Purging block data trash...');
                for (let i = 0; i < currentItems.length; i++) {
                    await bot.tossStack(currentItems[i]).catch(() => {});
                }
            } else {
                // Look around smoothly
                await bot.look((Math.random() * 360) * (Math.PI/180), 0, false);
            }
        }

    } catch (error) {
        // Suppress trivial execution blocks to ensure loop never stops
    }

    // Dynamic Interval Control: Run the next bundle of operations in 3 to 7 seconds
    const loopDelay = Math.floor(Math.random() * 4000) + 3000;
    setTimeout(executeAntiAFKLoop, loopDelay);
}

// Fire up the matrix core
launchBot();
