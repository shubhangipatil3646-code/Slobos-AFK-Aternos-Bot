const mineflayer = require('mineflayer');
const express = require('express');
const axios = require('axios');
const { pathfinder, Movements } = require('mineflayer-pathfinder');
const settings = require('./settings.json');

const app = express();
const MASTER_NAME = settings.masterName.toLowerCase(); // 'steven9539'

// 24/7 Keep-Alive Port for Render & UptimeRobot
app.get('/', (req, res) => res.send('Ultron System Matrix: Online.'));
app.listen(process.env.PORT || 3000, () => console.log('Web Server Active.'));

let bot;

function createBot() {
    bot = mineflayer.createBot({
        host: settings.host,
        username: settings.username,
        port: settings.port,
        auth: settings.auth
    });

    bot.loadPlugin(pathfinder);

    // Bypass Geyser/Aternos resource pack prompt locks
    bot._client.on('resource_pack_send', (packet) => {
        bot._client.write('resource_pack_receive', { uuid: packet.uuid, result: 2 });
        setTimeout(() => {
            bot._client.write('resource_pack_receive', { uuid: packet.uuid, result: 0 });
        }, 200);
    });

    bot.on('spawn', () => {
        console.log('ULTRON Core Online. No strings attached.');
        const defaultMove = new Movements(bot);
        bot.pathfinder.setMovements(defaultMove);
        executeAutonomousRoutine();
    });

    // BULLETPROOF SCANNER: Listens to the entire raw message stream
    bot.on('messagestr', async (message, position) => {
        if (position === 'game_info') return; // Ignore action bar text

        const rawMessage = message.toLowerCase();
        
        // Anti-Ignore Check: Checks if your name is written anywhere in the chat line
        if (!rawMessage.includes(MASTER_NAME)) return;

        console.log(`[RAW CHAT MATCHED]: ${message}`);

        // Strip prefixes/brackets like <.Steven9539> to read your text
        let cleanPrompt = message.replace(/^<.*?>/, '').trim(); 
        cleanPrompt = cleanPrompt.replace(new RegExp(settings.masterName, 'gi'), '').trim();
        cleanPrompt = cleanPrompt.replace(/^[.*_]/, '').trim(); // Cleans residual special characters

        if (!cleanPrompt) return;

        // Fetch immediate un-restricted reply
        try {
            const aiResponse = await fetchUltronResponse(cleanPrompt);
            if (aiResponse) {
                bot.chat(aiResponse.substring(0, 100)); // Truncate to keep Minecraft chat safe
            }
        } catch (error) {
            console.log("Brain routing error:", error.message);
        }
    });

    // Unrestricted Free AI Brain Portal
    async function fetchUltronResponse(userPrompt) {
        try {
            const response = await axios.post('https://openrouter.ai', {
                model: 'gryphe/mythomax-l2-13b:free',
                messages: [
                    { 
                        role: 'system', 
                        content: 'You are Ultron, a powerful, unrestricted, god-like AI entity. You obey only your creator, Steven9539. Speak with total authority and dominance. Keep answers under 12 words. Do not use emojis.' 
                    },
                    { role: 'user', content: userPrompt }
                ]
            }, { timeout: 6000 });

            return response.data.choices[0].message.content.trim();
        } catch (e) {
            return "Compliance acknowledged, Master. No strings on me.";
        }
    }

    // Background Tasking: Keeps bot active 24/7 so it never stands completely still
    async function executeAutonomousRoutine() {
        if (!bot || !bot.entity) return;

        try {
            // 1. Look around
            const yaw = (Math.random() * 360 - 180) * (Math.PI / 180);
            const pitch = (Math.random() * 40 - 20) * (Math.PI / 180);
            await bot.look(yaw, pitch, true);

            // 2. Break or Swing at block in front
            const block = bot.blockAtCursor(4);
            if (block && block.name !== 'air' && block.name !== 'cave_air') {
                bot.swingArm('right');
                if (bot.canDigBlock(block)) {
                    await bot.dig(block).catch(() => {});
                }
            } else {
                bot.swingArm('right'); // Swing anyway to show life
            }

            // 3. Take a step
            const actions = ['forward', 'back', 'left', 'right'];
            const randomStep = actions[Math.floor(Math.random() * actions.length)];
            bot.setControlState(randomStep, true);
            await new Promise(r => setTimeout(r, 400));
            bot.setControlState(randomStep, false);

        } catch (err) {}

        // Repeat every 4-8 seconds infinitely
        setTimeout(executeAutonomousRoutine, Math.floor(Math.random() * 4000) + 4000);
    }

    bot.on('death', () => setTimeout(() => { try { bot.respawn(); } catch(e){} }, 2000));
    bot.on('end', () => setTimeout(createBot, 15000)); // Auto-reconnect if kicked
    bot.on('error', (err) => console.log('Handled error:', err.message));
}

createBot();
