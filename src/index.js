import { getAllUsers, reset } from './db.js'
import { registerWebhook, sendPlainText, startTyping, unRegisterWebhook } from './telegram'
import { openAICompletion } from './openai'
import { listModes, setUserMode } from './prompt'

export default {
  async fetch (request, env) {
    return await perform(request, env)
  }
}

async function perform (event, env) {
  const url = new URL(event.url)
  const SECRET = await env.openai.get('telegramWebhookSecret')
  const WEBHOOK = '/endpoint'

  if (url.pathname === WEBHOOK) {
    return await handleWebhook(event, env, SECRET)
  } else if (url.pathname === '/registerWebhook') {
    return await registerWebhook(env, url, WEBHOOK, SECRET)
  } else if (url.pathname === '/unRegisterWebhook') {
    return await unRegisterWebhook(env)
  } else {
    return new Response('No handler for this request')
  }
}

/**
 * Handle requests to WEBHOOK
 * https://core.telegram.org/bots/api#update
 */
async function handleWebhook (event, env, SECRET) {
  // Check secret
  if (event.headers.get('X-Telegram-Bot-Api-Secret-Token') !== SECRET) {
    return new Response('Unauthorized', { status: 403 })
  }

  const update = await event.json()
  try {
    await onUpdate(env, update)
  } catch (e) {
    const adminId = await env.openai.get('adminId')

    await sendPlainText(env, adminId, 'Error: ' + e.toString())
  }
  return new Response('Ok')
}

/**
 * Handle incoming Update
 * https://core.telegram.org/bots/api#update
 */
async function onUpdate (env, update) {
  const adminId = await env.openai.get('adminId')

  if ('message' in update) {
    await startTyping(env, update)

    const text = update.message.text

    console.log(text)
    if (text.startsWith('/mode')) {
      const mode = text.split(' ')[1]
      const args = text.split(' ').splice(2).join(' ')

      await setUserMode(env, update.message.from.id, mode, args)

      await reset(env, update.message.from.id)

      await sendPlainText(env, update.message.chat.id, 'Mode set to: ' + mode)
    } else if (text === '/backfrommaintenance') {
      if (update.message.from.id.toString() === adminId) {
        const results = await getAllUsers(env)
        for (const result of results) {
          await sendPlainText(env, result.userId, 'Ok, I am back')
        }
      }
    } else if (text === '/listmodes') {
      const modes = await listModes(env)

      await sendPlainText(env, update.message.chat.id, 'Available modes:\n\n' + modes.join('\n'))
    } else if (text === '/forget') {
      await reset(env, update.message.from.id)
      await sendPlainText(env, update.message.chat.id, 'Ok, I forgot everything')
    } else {
      await onMessage(env, update.message)
    }
  }
}

/**
 * Handle incoming Message
 * https://core.telegram.org/bots/api#message
 */
async function onMessage (env, message) {
  const completion = await openAICompletion(env, message)

  return await sendPlainText(env, message.chat.id, completion)
}
