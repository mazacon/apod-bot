/**
 * Configurable constants
 */
const TOKENS = {
  discord: 'discord-bot-token',
  nasa: 'nasa-api-token',
};
const NASA_URL = `https://api.nasa.gov/planetary/apod?api_key=${TOKENS.nasa}`;

module.exports = {
  TOKENS,
  NASA_URL,
};
