/**
 * This bot sends the NASA APOD in discord channel on configurable time every day
 */
const https = require('https');
const schedule = require('node-schedule');
const discordjs = require('discord.js');
const client = new discordjs.Client();
const { CHANNEL, TOKENS, NASA_URL } = require('./constants.js');

/**
 * Reaches out to the NASA_URL and returns whatever is needed
 * @returns {Promise<NASAData>}
 */
async function getAPOD() {
  return new Promise((res, rej) => {
    let result = '';
    const req = https.get(NASA_URL, (response) => {
      // Listen for incoming data on the stream
      response.on('data', data => result += data);
      // Handle errors on the stream and call the Promise's reject function. 
      // This let's users of this function know that something went wrong
      response.on('error', rej);
      // When the stream has finished sending data let's send it back to the
      // original function all
      response.on('end', _ => {
        // deserialize the data (turn a buffer into object data that our code
        // can understand)
        if (result.length === 0) {
          const msg = "Result was empty and status code was: "
            + response.statusCode;
          rej(new Error(msg));
        }
        const deserialized = JSON.parse(result);
        // call the Promise's resolve callback function which let the user of
        // the function know that this is what they want
        res(deserialized);
      });
    });
  });
}

/**
 * This function sends the APOD as a formatted embed Discord message
 */
async function sendAPOD() {
  const data = await getAPOD();
  const channel = await client.channels.fetch(CHANNEL, true);
  console.debug(data);

  const embed = new discordjs.MessageEmbed();

  if (data.media_type === 'image') {
    if (data.hdurl) embed.setImage(data.hdurl);
    else embed.setImage(data.url);
    embed.setTitle(data.title);
  }
  else if (data.url.includes('youtube')) {
    let link = 'https://www.youtube.com/watch?v=';
    link += data.url.substring(30);
    await channel.send(link).catch(console.log);
  }
  else await channel.send(data.url).catch(console.log);

  let footer = 'APOD for ' + data.date;
  if (data.copyright) footer += ' • Photo by ' + data.copyright;

  embed
    .setDescription(data.explanation)
    .setColor('PURPLE')
    .setFooter(footer);

  await channel.send(embed).catch(console.log);
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

/**
 * Handles incoming messages that the Discord bot can see
 * @param {Message} msg
 * @returns {Promise<void>}
 */
async function onMessage(msg) {
  // this will allow us to ignore case-sensitivity when talking to the bot
  const cmd = msg.content.toLowerCase();

  if (cmd === 'apod.get_data') {
    const pending = await msg.reply('Fetching your data!');
    const data = await getAPOD();
    await pending.delete();
    await msg.reply(JSON.stringify(data));
  }
  if (cmd === 'apod.get_apod') {
    await sendAPOD();
  }
}

async function main() {
  client.on('ready', onReady.bind(client));
  client.on('message', onMessage.bind(client));

  await client.login(TOKENS.discord);

  let job = schedule.scheduleJob('playgroundJob', '* * * * *', sendAPOD);

  console.log(schedule.scheduledJobs)
  console.log('gap');
  console.log(job)
}

main().catch(console.error);

