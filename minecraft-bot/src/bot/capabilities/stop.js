module.exports = {
  name: 'stop',
  aliases: ['cancel'],
  description: 'Cancel the current task and clear pathing.',
  async execute(context) {
    return context.tasks.cancel();
  }
};
