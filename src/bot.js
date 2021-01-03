/**
 * This bot sends the NASA APOD in discord channel on configurable time every day
 */
const https = require('https');
const schedule = require('node-schedule');
const discordjs = require('discord.js');
const client = new discordjs.Client();
const { TOKENS, NASA_URL } = require('./constants.js');

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
 * @param {string} jobChannel
 * This function sends the APOD as a formatted embed Discord message
 */
async function sendAPOD(jobChannel) {
  const data = await getAPOD();
  const channel = await client.channels.fetch(jobChannel, true);
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
    console.log(`Ready as: ${user.tag}`);
    console.log(`Client ID: ${user.id}`);
  }
  client.user.setActivity('apod.help');
}

/**
 * Handles incoming messages that the Discord bot can see
 * @param {Message} msg
 * @returns {Promise<void>}
 */
async function onMessage(msg) {
  // this = Client
  const { user } = this;

  // this will allow us to ignore case-sensitivity when talking to the bot
  const cmd = msg.content.toLowerCase();

  if (cmd.substring(0, 5) === 'apod.') {
    let method = '';
    let args = [];
    if (cmd.indexOf(' ') === -1) method = cmd.substring(5)
    else {
      method = cmd.substring(5, cmd.indexOf(' '));
      args = cmd.substring(cmd.indexOf(' ')+1).split(' ');
    }

    switch (method) {
      case 'get_invite':
        const botURL = 'https://discord.com/oauth2/authorize?client_id=';
        msg.reply(botURL+user.id+'&scope=bot');
        break;
      case 'set_channel':
        msg.reply('WIP');
        break;
      case 'set_time':
        msg.reply('WIP');
        break;
      case 'set':
        let h = args[1].substring(0,2);
        let m = args[1].substring(2);
        let cron = `${+m} ${+h} * * *`;
        schedule.scheduleJob(args[0], cron, sendAPOD(args[0]));
        break;
      case 'get_raw':
        const pending = await msg.reply('Fetching your data!');
        const data = await getAPOD();
        await pending.delete();
        await msg.reply(JSON.stringify(data));
        break;
      case 'get':
        await sendAPOD(msg.channel.id);
        break;
      case 'help':
        const commands = new discordjs.MessageEmbed();
        commands.addFields(
          { name: 'apod.get_invite', value: "Retrieves bots' invite link." },
          { name: 'apod.get_raw', value: "Retrieves APODs' raw JSON data" },
          { name: 'apod.get', value: "Will immediately send formatted APOD" },
          { 
            name: 'apod.set <channel_id> <milCST>',
            value: "Sets where/when to send APODs. Ex. `apod.set 123456789123456789 0805` \
                    will send in channel 123456789123456789 at 8:05 CST daily." 
          },
        )
        msg.reply(commands)
        break;
    }
  }
}

async function main() {
  client.on('ready', onReady.bind(client));
  client.on('message', onMessage.bind(client));
  await client.login(TOKENS.discord);
}

main().catch(console.error);
