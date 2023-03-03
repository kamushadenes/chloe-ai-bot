import {getSystemPrompt} from "./prompt";
import {getMessages, insertMessage, reset} from "./db";

async function summarize(env, text) {
    let apiKey = await env.openai.get('apiKey');

    let result = await fetch("https://api.openai.com/v1/chat/completions",
        {
            "headers": {
                "Authorization": "Bearer " + apiKey,
                "Content-Type": "application/json"
            },
            "method": "POST",
            "body": JSON.stringify({
                "model": "gpt-3.5-turbo",
                // https://wfhbrian.com/the-best-way-to-summarize-a-paragraph-using-gpt-3/
                "messages": [
                    {
                        "role": "user",
                        "content":
                            "We introduce Extreme TLDR generation, a new form of extreme summarization for " +
                            "paragraphs. TLDR generation involves high source compression, removes stop words " +
                            "and summarizes the paragraph whilst retaining meaning. " +
                            "The result is the shortest possible summary that retains all of the original " +
                            "meaning and context of the paragraph.\n" +
                            "\n" +
                            "Example\n" +
                            "\n" +
                            "Paragraph:\n" +
                            "\n" +
                            text +
                            "\n\n" +
                            "Extreme TLDR:",
                    }
                ],
            })
        })

    let j = await result.json();

    return j["choices"][0]["message"]["content"];
}

export async function openAICompletion(env, message) {
    let text = message.text;
    let apiKey = await env.openai.get('apiKey');

    let system_prompt = await getSystemPrompt(env, message);

    let messages = [
        {
            "role": "system",
            "content": system_prompt.join("\n"),
        },
    ];

    let hasContext = true;

    try {
        let results = await getMessages(env, message.chat.id);

        if (results.length > 0) {
            for (const result of results) {
                if (result.content.length > result.content.summary) {
                    messages.push({
                        "role": result.role,
                        "content": result.summary,
                    });
                } else {
                    messages.push({
                        "role": result.role,
                        "content": result.content,
                    });
                }
            }
        }
    } catch {
        hasContext = false;
    }

    messages.push({
        "role": "user",
        "content": text,
    });


    try {
        let summary = await summarize(env, text);
        await insertMessage(env, message.chat.id, "user", text, summary);
    } catch {
        hasContext = false;
    }

    while (true) {
        let result = await fetch("https://api.openai.com/v1/chat/completions",
            {
                "headers": {
                    "Authorization": "Bearer " + apiKey,
                    "Content-Type": "application/json"
                },
                "method": "POST",
                "body": JSON.stringify({
                    "model": "gpt-3.5-turbo",
                    "messages": messages,
                })
            })

        if (result.status === 400) {
            let j = await result.json();
            if (j.error.code === "context_length_exceeded") {
                if (messages.length > 2) {
                    messages = messages.splice(1, 1)
                    continue
                }
                await reset(env, message.chat.id);
                return "Error: Context size exceeded, I had to forget everything. Please try again.";
            } else {
                return "Error: " + j.error.message;
            }
        }

        let j = await result.json();

        let content = j["choices"][0]["message"]["content"];

        try {
            let summary = await summarize(env, text);
            await insertMessage(env, message.chat.id, "assistant", content, summary);
        } catch {
            hasContext = false;
        }

        if (!hasContext) {
            content = "Warning: Context backend offline, I won't recognize previous messages.\n\n" + content;
        }

        return content;
    }
}