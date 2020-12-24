/**
 * Event handler functions
 */
const getAPOD = require('./nasa.js');


/**
 * Handles incoming messages that the Discord bot can see
 * @param {Message} msg
 * @returns {Promise<void>}
 */
async function onMessage(msg) {
// this will allow us to ignore case-sensitivity when talking to the bot
  const cmd = msg.content.toLowerCase();
  if (cmd === '!getdata') {
    const pending = await msg.reply('Fetching your data!');
    const data = await getAPOD();
    await pending.delete();
    await msg.reply(JSON.stringify(data));
  }
}

/**
 * This function is called when a connection between the bot and Discord's
 * websocket has been established.
 */
function onReady() {
  // this = Client
  const { user } = this;
  // if the bot is not logged in then user is null
  if (user !== undefined) {
    console.log(`Ready as ${user.tag}`);
  }
}

module.exports = {
  onMessage,
  onReady,
};
