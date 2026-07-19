const mineflayer = require('mineflayer'); 
const express = require('express');
const axios = require('axios'); 
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const settings = require('./settings.json'); // Links your settings file
const app = express();

const MASTER_NAME = settings.masterName; // Loads your name from settings.json automatically

app.get('/', (req, res) => res.send('JARVIS Matrix: Fully operational.'));
app.listen(process.env.PORT || 3000, () => console.log('Render Port Online.'));

function createBot() {
    const bot = mineflayer.createBot({
        host: settings.host, 
        username: settings.username, 
        version: settings.version,
        auth: settings.auth
    }); 

    bot.loadPlugin(pathfinder);

    bot.on('spawn', () => {
        console.log('JARVIS Systems Activated. Running stealth anti-AFK sequences.');
        setTimeout(executeHumanRoutine, Math.floor(Math.random() * 4000) + 3000);
    }); 

    bot.on('death', () => {
        const respawnDelay = Math.floor(Math.random() * 2000) + 2000;
        setTimeout(() => { try { bot.respawn(); } catch (e) {} }, respawnDelay);
    });

    async function smoothLook(targetYaw, targetPitch, steps = 10) {
        const currentYaw = bot.entity.yaw;
        const currentPitch = bot.entity.pitch;
        for (let i = 1; i <= steps; i++) {
            const tempYaw = currentYaw + (targetYaw - currentYaw) * (i / steps);
            const tempPitch = currentPitch + (targetPitch - currentPitch) * (i / steps);
            await bot.look(tempYaw, tempPitch, true);
            await bot.waitForTicks(1); 
        }
    }

    bot.on('chat', async (username, message) => {
        if (username !== MASTER_NAME) return; 

        const cleanMessage = message.toLowerCase().trim();

        if (cleanMessage === 'follow') {
            bot.chat('Right away, sir. Initializing trajectory tracking.');
            const playerEntity = bot.players[username]?.entity;
            if (playerEntity) {
                const mcData = require('minecraft-data')(bot.version);
                const defaultMove = new Movements(bot, mcData);
                bot.pathfinder.setMovements(defaultMove);
                bot.pathfinder.setGoal(new goals.GoalFollow(playerEntity, 2), true); 
            } else {
                bot.chat('Visual markers lost, sir. Please come within my immediate perimeter.');
            }
            return;
        }

        if (cleanMessage === 'stop') {
            bot.chat('Halting navigation sequences. Standing down, sir.');
            bot.pathfinder.setGoal(null);
            return;
        }

        if (cleanMessage === 'terminate') {
            bot.chat('Powering down systems. Goodbye, sir.');
            bot.quit();
            return;
        }

        console.log(`Processing master request through AI engine: "${message}"`);
        
        try {
            const jarvisIdentityPrompt = `You are JARVIS from Iron Man, the highly sophisticated, witty, and loyal AI assistant to Tony Stark. You are currently talking to your master inside a Minecraft multiplayer text chat room. Respond shortly and clearly (under 15 words) because Minecraft chat boxes are small. Call the user "sir". Keep your classic sarcastic, formal, intelligent tone. Input phrase: `;
            const response = await axios.get(`https://duckduckgo.com{encodeURIComponent(jarvisIdentityPrompt + message)}&format=json`);
            
            let aiReply = response.data.AbstractText || response.data.Heading;

            if (!aiReply || aiReply.length < 2) {
                const localReplies = [
                    "Always a pleasure watching you work, sir.",
                    "Systems are fully optimized and operational.",
                    "At your service, sir. What are our next coordinates?",
                    "My processing cycles are dedicated entirely to your base, sir."
                ];
                aiReply = localReplies[Math.floor(Math.random() * localReplies.length)];
            }

            if (aiReply.length > 80) aiReply = aiReply.substring(0, 77) + "...";
            bot.chat(aiReply);

        } catch (error) {
            console.log("AI Pipeline Error:", error.message);
            bot.chat("My communication matrix encountered a brief latency glitch, sir.");
        }
    });

    async function executeHumanRoutine() {
        if (!bot.entity || !bot.entity.position) {
            setTimeout(executeHumanRoutine, 5000);
            return;
        } 
        if (bot.pathfinder.isMoving()) {
            setTimeout(executeHumanRoutine, 10000);
            return;
        }

        try {
            const actionWeight = Math.random();
            if (actionWeight < 0.40) {
                const randomYaw = (Math.random() * 360 - 180) * (Math.PI / 180);
                const randomPitch = (Math.random() * 60 - 30) * (Math.PI / 180); 
                await smoothLook(randomYaw, randomPitch, 12);
            } 
            else if (actionWeight >= 0.40 && actionWeight < 0.70) {
                const controlState = Math.random() > 0.5 ? 'jump' : 'sneak';
                bot.setControlState(controlState, true);
                await bot.waitForTicks(Math.floor(Math.random() * 8) + 4);
                bot.setControlState(controlState, false);
            } 
            else {
                const directions = [new mineflayer.vec3(1,0,0), new mineflayer.vec3(-1,0,0), new mineflayer.vec3(0,0,1), new mineflayer.vec3(0,0,-1)];
                const chosenDirection = directions[Math.floor(Math.random() * directions.length)];
                const targetBlockPos = bot.entity.position.plus(chosenDirection).floored();
                const targetBlock = bot.blockAt(targetBlockPos); 

                if (targetBlock && !['air', 'water', 'lava', 'bedrock'].includes(targetBlock.name)) {
                    if (bot.canDigBlock(targetBlock)) {
                        const posDiff = targetBlockPos.minus(bot.entity.position);
                        await smoothLook(Math.atan2(-posDiff.x, -posDiff.z), 0.2, 8);
                        await bot.dig(targetBlock);
                        await bot.waitForTicks(20); 
                        const blockInInventory = bot.inventory.items().find(item => item.name === targetBlock.name);
                        if (blockInInventory) {
                            await bot.equip(blockInInventory, 'hand');
                            const supportBlock = bot.blockAt(targetBlockPos.offset(0, -1, 0));
                            if (supportBlock) await bot.placeBlock(supportBlock, new mineflayer.vec3(0, 1, 0));
                        }
                    }
                }
            }
        } catch (e) {} 

        setTimeout(executeHumanRoutine, Math.floor(Math.random() * 24000) + 18000);
    } 

    bot.on('end', (reason) => {
        setTimeout(createBot, Math.floor(Math.random() * 25000) + 20000); 
    }); 
    bot.on('error', (err) => console.log('Matrix Error:', err.message));
} 

createBot();
