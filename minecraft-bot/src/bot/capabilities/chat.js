module.exports = {
  name: 'chat',
  description: 'Respond through LM Studio.',
  async execute(context, command) {
    const prompt = command.args?.prompt?.trim();
    if (!prompt) {
      return { ok: false, message: 'Say something after "bot".' };
    }

    const reply = await context.lmStudio.ask(prompt, command.username);
    return { ok: true, message: reply };
  }
};
