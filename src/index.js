import {getMessages, insertMessage, reset} from './db.js';
import {registerWebhook, sendPlainText, startTyping, unRegisterWebhook} from "./telegram";
import {openAICompletion} from "./openai";
import {setUserMode, listModes} from "./prompt";

export default {
    async fetch(request, env) {
        return await perform(request, env);
    }
}

async function perform(event, env) {
    const url = new URL(event.url)
    const SECRET = await env.openai.get("telegramWebhookSecret");
    const WEBHOOK = '/endpoint'

    if (url.pathname === WEBHOOK) {
        return await handleWebhook(event, env, SECRET);
    } else if (url.pathname === '/registerWebhook') {
        return await registerWebhook(env, url, WEBHOOK, SECRET);
    } else if (url.pathname === '/unRegisterWebhook') {
        return await unRegisterWebhook(env);
    } else {
        return new Response('No handler for this request');
    }
}

/**
 * Handle requests to WEBHOOK
 * https://core.telegram.org/bots/api#update
 */
async function handleWebhook(event, env, SECRET) {
    // Check secret
    if (event.headers.get('X-Telegram-Bot-Api-Secret-Token') !== SECRET) {
        return new Response('Unauthorized', {status: 403});
    }

    const update = await event.json();
    try {
        await onUpdate(env, update);
    } catch (e) {
        let adminId = await env.openai.get('adminId');

        if (update.message.from.id.toString() === adminId) {
            await sendPlainText(env, update.message.chat.id, 'Error: ' + e.toString());
        }
    }
    return new Response('Ok')
}

/**
 * Handle incoming Update
 * https://core.telegram.org/bots/api#update
 */
async function onUpdate(env, update) {
    if ('message' in update) {
        await startTyping(env, update);

        let text = update.message.text;

        console.log(text);
        if (text.startsWith('/mode')) {
            let mode = text.split(' ')[1];
            let args = text.split(' ').splice(2).join(' ');

            await setUserMode(env, update.message.from.id, mode, args);

            await reset(env, update.message.from.id);

            await sendPlainText(env, update.message.chat.id, 'Mode set to: ' + mode);
        } else if (text === "/listmodes") {
            let modes = await listModes(env);

            await sendPlainText(env, update.message.chat.id, 'Available modes:\n\n' + modes.join('\n'));
        } else if (text === "/forget") {
            await reset(env, update.message.from.id);
            await sendPlainText(env, update.message.chat.id, 'Ok, I forgot everything');
        } else {
            await sendPlainText(env, update.message.chat.id, 'I\'m under maintenance, please try again later');
            await onMessage(env, update.message)
        }
    }
}

/**
 * Handle incoming Message
 * https://core.telegram.org/bots/api#message
 */
async function onMessage(env, message) {
    let adminId = await env.openai.get('adminId');
    let completion = await openAICompletion(env, message);

    await sendPlainText(env, adminId, completion);
    //return await sendPlainText(env, message.chat.id, completion);
}

