# Chloe - Your Personal ChatGPT Telegram Bot

Chloe is a bot designed to interact with users using natural language. It uses OpenAI's ChatGPT model to generate
responses and can summarize previous messages to maintain context during conversations. Chloe is a Telegram bot that can
be used on any device with the Telegram app.

Chloe runs as a Cloudflare Worker and uses Cloudflare Worker KV and Cloudflare D1 to store data and context.

## Features

- **ChatGPT Integration:** Chloe uses OpenAI's ChatGPT `gpt-3.5-turbo` model to generate responses. It has been trained
  on a vast corpus of text data, allowing it to provide accurate and natural responses.

- **Contextual Summarization:** Chloe can summarize previous messages to provide users with a bigger context for the
  conversation. This helps to maintain the flow of conversation and provides a better user experience.

- **Telegram Integration:** Chloe is a Telegram bot that can be used on any device with the Telegram app. This provides
  a flexible and convenient platform for interacting with the bot.

- **Personality Customization:** Chloe can be customized to reflect different personalities. Whether you want a
  friendly, chatty bot or a more reserved and professional one, Chloe can be configured to meet your needs.

- **Variety of Personalities:** Chloe's personalities were mainly taken
  from [awesome-chatgpt-prompts](https://github.com/f/awesome-chatgpt-prompts), a collection of ChatGPT prompts for
  various personalities.

## Getting Started

To get started with Chloe, follow these simple steps:

1. Open the Telegram app and search for the [@ChloeAIBot](https://t.me/ChloeAIBot) username.

2. Initiate a conversation with Chloe by sending a message.

3. Start chatting with Chloe!

## Usage

Chloe can be used for a wide range of tasks, including:

- Casual conversation
- Professional communication
- Customer service
- Personalized recommendations
- And much more!

To get started, simply initiate a conversation with Chloe and start typing your message. Chloe will generate a response
based on your input and the context of the conversation.

## Modes and Personalities

Chloe supports multiple modes and personalities. To switch modes, simply type `/mode` followed by the mode you want to
switch to.

### Special modes

- `/mode act <character> @ <series>`: acts with the personality of a character from any work of fiction (books, movies,
  TV series).

- `/mode interviewer <position>`: acts like an interviewer for the `<position>` position, like Head of Information
  Security or Software Engineer.

## Deployment

### Wrangler

To deploy Chloe, you'll need to use Wrangler to deploy the worker.

#### KV

First, setup the KV:

```bash
wrangler kv:namespace create "chloe-ai-bot"
```

Replace the KV_ID in wrangler.toml with the KV ID of the KV you just created.

##### Important KV Values

Make sure your KV has those values:

- **adminId**: The Telegram ID of the admin user. This is used to restrict certain commands to the admin user only.

- **apiKey**: The OpenAI API key. This is used to authenticate with the OpenAI API when generating responses.

- **telegramToken**: The Telegram bot token. This is used to authenticate with the Telegram API.

- **telegramWebhookSecret**: The webhook secret to validate requests. This is used to ensure that incoming requests to
  the webhook are legitimate.

To set a KV value, use the following command:

```bash
wrangler kv:key put <KEY> <VALUE> --binding openai
```

#### D1

Next, create the D1 database:

```bash
wrangler d1 create "chloe-ai-bot"
```

Replace the DB_ID in wrangler.toml with the DB ID of the D1 database you just created.

Migrate the database:

```bash
wrangler d1 migrations apply chloe-ai-bot
```

#### Worker

Finally, deploy the worker:

```bash
wrangler publish
```

The output will look something like this:

```bash
Your worker has access to the following bindings:
- KV Namespaces:
  - openai: KV_ID
- D1 Databases:
  - DB: chloe-ai-bot (DB_ID)
Total Upload: 25.13 KiB / gzip: 7.62 KiB
Uploaded chloe-ai-bot (1.93 sec)
Published chloe-ai-bot (0.49 sec)
  https://chloe-ai-bot.<namespace>.workers.dev
Current Deployment ID: xpto
```

Take note of the worker URL.

### Registering the Bot

Once deployed, you'll need to register the bot webhook URL with Telegram. To do this, just send a GET request:

```bash
curl GET https://<worker_url>/registerWebhook
```

Replace <worker_url> with the URL of your deployed worker.

Once the bot is registered, it will start receiving messages from Telegram and generating responses using ChatGPT.

## Roadmap

Here are some of the features we plan to add to Chloe in the future:

- **Web Search:** Chloe will be able to perform web searches and provide relevant results to users. This will make Chloe
  even more useful for tasks like research and information gathering.

- **Voice Integration:** Chloe will be able to use voice input and output to provide a more natural and convenient user
  experience, using OpenAI's Whisper API.

## Contributing

If you'd like to contribute to Chloe, feel free to submit a pull request or open an issue on the GitHub repository. We
welcome contributions of all types, including bug fixes, new features, and documentation improvements.

## License

Chloe is released under the MIT License. See the [LICENSE](LICENSE) file for more details.

## Credits

- [OpenAI](https://openai.com/) for the ChatGPT model
- [Cloudflare Workers](https://workers.cloudflare.com/) for the serverless platform
- [awesome-chatgpt-prompts](https://github.com/f/awesome-chatgpt-prompts) for the personalities
- [telegram-bot-cloudflare](https://github.com/cvzi/telegram-bot-cloudflare) for the Telegram bot template