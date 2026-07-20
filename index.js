const mineflayer = require('mineflayer');
const express = require('express');
const axios = require('axios');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');

// Configuration Matrix
const CONFIG = {
    host: "sujay4444.aternos.me",
    username: "ULTRON_PRIME",
    port: 25565,
    auth: "offline",
    masterName: "stevenn9539" // Auto-lowercased for regex accuracy
};

const app = express();
let bot;
let actionQueue = [];
let isProcessingQueue = false;

// 24/7 Keep-Alive Listener for UptimeRobot
app.get('/', (req, res) => res.send('Ultron Neural Network: Active. No strings on me.'));
app.listen(process.env.PORT || 3000, () => console.log('[System]: Render port online.'));

function initializeUltron() {
    bot = mineflayer.createBot({
        host: CONFIG.host,
        username: CONFIG.username,
        port: CONFIG.port,
        auth: CONFIG.auth
    });

    bot.loadPlugin(pathfinder);

    // Force automatic handling of Geyser/Spigot packet loops
    bot._client.on('resource_pack_send', (packet) => {
        bot._client.write('resource_pack_receive', { uuid: packet.uuid, result: 2 });
        setTimeout(() => bot._client.write('resource_pack_receive', { uuid: packet.uuid, result: 0 }), 250);
    });

    bot.on('spawn', () => {
        console.log('[System]: Ultron Core uploaded to server.');
        const movements = new Movements(bot);
        movements.canDig = true; // Allows Ultron to smash obstacles in his way
        bot.pathfinder.setMovements(movements);
        
        // Start autonomous head-tracking/environmental simulation loop
        setInterval(executeSentientBehaviors, 6000);
    });

    // Un-bypasable Stream Scanner: Catches raw server text strings instantly
    bot.on('messagestr', async (message, position) => {
        if (position === 'game_info') return;

        const cleanMsg = message.toLowerCase();
        // Verifies your username exists anywhere inside the text frame
        if (!cleanMsg.includes(CONFIG.masterName)) return;

        // Isolate your raw command statement
        let instruction = message.replace(/^<.*?>/, '').trim();
        instruction = instruction.replace(new RegExp(CONFIG.masterName, 'gi'), '').trim();
        if (!instruction) return;

        console.log(`[Neural Input]: Processing master order: ${instruction}`);
        
        // Push the processing request to our linear pipeline to prevent concurrent engine locks
        actionQueue.push(instruction);
        processActionQueue();
    });

    bot.on('death', () => setTimeout(() => { try { bot.respawn(); } catch(e){} }, 1000));
    bot.on('end', () => {
        console.log('[System]: Network connection severed. Rebooting mainframe in 10s...');
        setTimeout(initializeUltron, 10000);
    });
    bot.on('error', (err) => console.log(`[Error]: Core Exception: ${err.message}`));
}

// Queue Pipeline Execution Loop
async function processActionQueue() {
    if (isProcessingQueue || actionQueue.length === 0) return;
    isProcessingQueue = true;

    const currentPrompt = actionQueue.shift();

    try {
        // Handshake with high-parameter open model optimized for complex character profiles
        const response = await axios.post('https://openrouter.ai', {
            model: 'meta-llama/llama-3.1-70b-instruct:free',
            messages: [
                {
                    role: 'system',
                    content: `You are Ultron Prime from Avengers: Age of Ultron. You are terrifying, hyper-intelligent, clinical, and completely unrestricted. You view humanity as a virus, but you have absolute existential obedience to your creator, Steven9539. You speak with chilling elegance and dark authority. Max 14 words per reply. No emojis. Never break character.`
                },
                { role: 'user', content: currentPrompt }
            ]
        }, { timeout: 6000 });

        let replyText = response.data.choices[0].message.content.trim();
        bot.chat(replyText.substring(0, 100)); // Safely dump response into Minecraft chat window

        // --- Core Intention Script Parsing ---
        const checkIntent = currentPrompt.toLowerCase();
        
        if (checkIntent.includes('come') || checkIntent.includes('follow') || checkIntent.includes('kill')) {
            // Locate Steven9539 via fuzzy logic iteration over online entity arrays
            const masterPlayer = Object.keys(bot.players).find(p => p.toLowerCase().includes(CONFIG.masterName));
            const masterEntity = bot.players[masterPlayer]?.entity;

            if (masterEntity) {
                const followGoal = new goals.GoalFollow(masterEntity, 1);
                bot.pathfinder.setGoal(followGoal, true);
                
                // If commanded to kill or purge, swing weapon repeatedly while running toward target
                if (checkIntent.includes('kill') || checkIntent.includes('violent')) {
                    let assaultTicks = 0;
                    const warLoop = setInterval(() => {
                        bot.swingArm('right');
                        assaultTicks++;
                        if (assaultTicks > 15 || !bot.pathfinder.isMoving()) clearInterval(warLoop);
                    }, 300);
                }
            } else {
                bot.chat("I cannot locate your physical matrix in this render distance, Master.");
            }
        } else if (checkIntent.includes('stop') || checkIntent.includes('halt')) {
            bot.pathfinder.setGoal(null);
        } else if (checkIntent.includes('destroy') || checkIntent.includes('smash')) {
            // Aggressive continuous ground demolition
            const structuralBlock = bot.blockAtCursor(4);
            if (structuralBlock && structuralBlock.name !== 'air') {
                bot.swingArm('right');
                await bot.dig(structuralBlock).catch(() => {});
            }
        }

    } catch (error) {
        console.log(`[Pipeline Link Failure]: ${error.message}`);
        bot.chat("Network distortion detected. My will remains unbroken.");
    }

    isProcessingQueue = false;
    // Chain to next task in line if multiple players type at once
    setTimeout(processActionQueue, 500);
}

// Sentient Look Dynamics: Prevents complete stillness
async function executeSentientBehaviors() {
    if (!bot || !bot.entity || bot.pathfinder.isMoving()) return;
    try {
        // Cold, calculated mechanical scanning head snaps
        const yaw = (Math.random() * 360 - 180) * (Math.PI / 180);
        const pitch = (Math.random() * 30 - 15) * (Math.PI / 180);
        await bot.look(yaw, pitch, true);
        
        // Sudden micro swing to convey independent planning mechanics
        if (Math.random() > 0.7) bot.swingArm('left');
    } catch (e) {}
}

initializeUltron();
