import { getSystemPrompt } from './prompt';
import {
  deleteMessage, getMessages, insertMessage, reset,
} from './db';

async function summarize(env, text) {
  const apiKey = await env.openai.get('apiKey');

  const result = await fetch('https://api.openai.com/v1/chat/completions', {
    headers: {
      Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify({
      model: 'gpt-3.5-turbo', // https://wfhbrian.com/the-best-way-to-summarize-a-paragraph-using-gpt-3/
      messages: [
        {
          role: 'user',
          content: 'We introduce Extreme TLDR generation, a new form of extreme summarization for '
                                                           + 'paragraphs. TLDR generation involves high source compression, removes stop words '
                                                           + 'and summarizes the paragraph whilst retaining meaning. '
                                                           + 'The result is the shortest possible summary that retains all of the original '
                                                           + 'meaning and context of the paragraph.\n'
                                                           + '\n'
                                                           + 'Example\n'
                                                           + '\n'
                                                           + 'Paragraph:\n'
                                                           + `\n${text}\n\n`
                                                           + 'Extreme TLDR:',
        },
      ],
    }),
  });

  const j = await result.json();

  return j.choices[0].message.content;
}

async function openAICompletion(env, message) {
  const { text } = message;
  const apiKey = await env.openai.get('apiKey');

  const systemPrompt = await getSystemPrompt(env, message);

  const messages = [
    {
      role: 'system', content: systemPrompt.join(' '),
    },
  ];

  let hasContext = true;

  try {
    const results = await getMessages(env, message.chat.id);
    console.log(results);

    Object.values(results).forEach((result) => {
      if (result.content.length > result.content.summary) {
        messages.push({
          role: result.role, content: result.summary,
        });
      } else {
        messages.push({
          role: result.role, content: result.content,
        });
      }
    });
  } catch (e) {
    hasContext = false;
    console.log(e.toString());
  }

  messages.push({
    role: 'user', content: text,
  });

  try {
    const summary = await summarize(env, text);
    await insertMessage(env, message.chat.id, 'user', text, summary);
  } catch (e) {
    hasContext = false;
    console.log(e.toString());
  }

  for (; ;) {
    // eslint-disable-next-line no-await-in-loop
    const result = await fetch('https://api.openai.com/v1/chat/completions', {
      headers: {
        Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        model: 'gpt-3.5-turbo', messages,
      }),
    });

    if (result.status === 400) {
      // eslint-disable-next-line no-await-in-loop
      const j = await result.json();
      if (j.error.code === 'context_length_exceeded') {
        if (messages.length > 2) {
          const deleted = messages.splice(1, 1);
          // eslint-disable-next-line no-await-in-loop
          await deleteMessage(env, deleted.timestamp, deleted.userId);
          continue;
        }
        // eslint-disable-next-line no-await-in-loop
        await reset(env, message.chat.id);
        return 'Error: Context size exceeded, I had to forget everything. Please try again.';
      }
      return `Error: ${j.error.message}`;
    }

    // eslint-disable-next-line no-await-in-loop
    const j = await result.json();

    let { content } = j.choices[0].message;

    try {
      // eslint-disable-next-line no-await-in-loop
      const summary = await summarize(env, text);
      // eslint-disable-next-line no-await-in-loop
      await insertMessage(env, message.chat.id, 'assistant', content, summary);
    } catch (e) {
      hasContext = false;
      console.log(e.toString());
    }

    if (!hasContext) {
      content = `Warning: Context backend offline, I won't recognize previous messages.\n\n${content}`;
    }

    return content;
  }
}

export default openAICompletion;
