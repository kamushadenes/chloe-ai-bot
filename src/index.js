import { getAllUsers, reset } from './db';
import {
  registerWebhook, sendPlainText, startTyping, unRegisterWebhook,
} from './telegram';
import openAICompletion from './openai';
import { listModes, setUserMode } from './prompt';

/**
 * Handle incoming Message
 * https://core.telegram.org/bots/api#message
 */
async function onMessage(env, message) {
  const completion = await openAICompletion(env, message);

  return sendPlainText(env, message.chat.id, completion);
}

/**
 * Handle incoming Update
 * https://core.telegram.org/bots/api#update
 */
async function onUpdate(env, update) {
  const adminId = await env.openai.get('adminId');

  if ('message' in update) {
    await startTyping(env, update);

    const { text } = update.message;

    console.log(`User: ${update.message.from.first_name} ${update.message.from.last_name} (${update.message.from.id})`);
    console.log(`Request: ${text}`);
    if (text.startsWith('/mode')) {
      const mode = text.split(' ')[1];
      const args = text.split(' ').splice(2).join(' ');

      const success = await setUserMode(env, update.message.from.id, mode, args);

      if (!success) {
        await sendPlainText(env, update.message.chat.id, `Mode ${mode} not found`);
      } else {
        await reset(env, update.message.from.id);

        await sendPlainText(env, update.message.chat.id, `Mode set to: ${mode}`);
      }
    } else if (text === '/backfrommaintenance') {
      if (update.message.from.id.toString() === adminId) {
        const results = await getAllUsers(env);

        const promises = results.map(async (result) => sendPlainText(
          env,
          result.userId,
          'Ok, I am back',
        ));

        await Promise.all(promises);
      }
    } else if (text === '/listmodes') {
      const modes = await listModes(env);

      await sendPlainText(env, update.message.chat.id, `Available modes:\n\n${modes.join('\n')}`);
    } else if (text === '/forget') {
      await reset(env, update.message.from.id);
      await sendPlainText(env, update.message.chat.id, 'Ok, I forgot everything');
    } else {
      await onMessage(env, update.message);
    }
  }
}

/**
 * Handle requests to WEBHOOK
 * https://core.telegram.org/bots/api#update
 */
async function handleWebhook(event, env, SECRET) {
  // Check secret
  if (event.headers.get('X-Telegram-Bot-Api-Secret-Token') !== SECRET) {
    return new Response('Unauthorized', { status: 403 });
  }

  const update = await event.json();
  try {
    await onUpdate(env, update);
  } catch (e) {
    const adminId = await env.openai.get('adminId');

    await sendPlainText(env, adminId, `Error: ${e.toString()}`);
  }
  return new Response('Ok');
}

async function perform(event, env) {
  const url = new URL(event.url);
  const SECRET = await env.openai.get('telegramWebhookSecret');
  const WEBHOOK = '/endpoint';

  if (url.pathname === WEBHOOK) {
    return handleWebhook(event, env, SECRET);
  }
  if (url.pathname === '/registerWebhook') {
    return registerWebhook(env, url, WEBHOOK, SECRET);
  }
  if (url.pathname === '/unRegisterWebhook') {
    return unRegisterWebhook(env);
  }
  return new Response('No handler for this request');
}

export default {
  async fetch(request, env) {
    return perform(request, env);
  },
};
