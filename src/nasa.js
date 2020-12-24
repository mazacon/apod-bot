const https = require('https');
const { NASA_URL } = require('./constants.js');

/**
 * @typedef {Object} NASAData
 * @property {String} copyright
 * @property {String} date
 * @property {String} explanation
 * @property {String} hdurl
 * @property {String} media_type
 * @property {String} service_version
 * @property {String} title
 * @property {String} url
 */

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

module.exports = getAPOD;
