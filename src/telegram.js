export async function startTyping(env, update) {
    let aurl = await apiUrl(env, 'sendChatAction', {
        chat_id: update.message.chat.id,
        action: "typing"
    });
    return (await fetch(aurl)).json()
}

/**
 * Send plain text message
 * https://core.telegram.org/bots/api#sendmessage
 */
export async function sendPlainText(env, chatId, text) {
    let aurl = await apiUrl(env, 'sendMessage', {
        chat_id: chatId,
        text
    });
    console.log(aurl);
    return (await fetch(aurl)).json()
}

/**
 * Set webhook to this worker's url
 * https://core.telegram.org/bots/api#setwebhook
 */
export async function registerWebhook(env, requestUrl, suffix, secret) {
    // https://core.telegram.org/bots/api#setwebhook
    const webhookUrl = `${requestUrl.protocol}//${requestUrl.hostname}${suffix}`;
    //const webhookUrl = "https://enagofsqyi3s7.x.pipedream.net";
    let aurl = await apiUrl(env, 'setWebhook', {'url': webhookUrl, 'secret_token': secret});

    const r = await (await fetch(aurl)).json()
    return new Response('ok' in r && r.ok ? 'Ok' : JSON.stringify(r, null, 2))
}

/**
 * Remove webhook
 * https://core.telegram.org/bots/api#setwebhook
 */
export async function unRegisterWebhook(env) {
    let aurl = await apiUrl(env, 'setWebhook', {'url': ''});
    const r = await (await fetch(aurl)).json()
    return new Response('ok' in r && r.ok ? 'Ok' : JSON.stringify(r, null, 2))
}

/**
 * Return url to telegram api, optionally with parameters added
 */
async function apiUrl(env, methodName, params = null) {
    let query = ''
    if (params) {
        query = '?' + new URLSearchParams(params).toString()
    }
    let token = await env.openai.get("telegramToken");
    return `https://api.telegram.org/bot${token}/${methodName}${query}`
}