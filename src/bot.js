/**
 * This bot is supposed to send a NASA photo every day in a specific channel
 */
const djs = require('discord.js');
const schedule = require('node-schedule');
const { CHANNEL, TOKENS } = require('./constants.js');
const getAPOD = require('./nasa.js');
const { onMessage, onReady } = require('./events.js');

/**
 * This is where everything starts
 */
async function main() {
  const client = new djs.Client();
  
  client.on('ready', onReady.bind(client));
  client.on('message', onMessage.bind(client));

  await client.login(TOKENS.discord);

  schedule.scheduleJob('0 8 * * *', async () => {
    const data = await getAPOD();
    const channel = await client.channels.fetch(CHANNEL, true);
    console.debug(data);

    const embed = new djs.MessageEmbed();

    embed.setTitle(data.title)
         .setImage(data.hdurl)
         .setDescription(data.explanation)
         .setColor('PURPLE')
         .setFooter('APOD for ' + data.date + ' • Photo by ' + data.copyright);

    await channel.send(embed).catch(console.log);
  });
}

main().catch(console.error);
