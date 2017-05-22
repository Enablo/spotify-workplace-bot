const request = require('request');
const config = require('config');
const logger = require('./logger');

// Configurations
const facebookWorkplace = config.get('facebookWorkplace');

// Setup a default Facebook request object
const facebookRequest = request.defaults({
  baseUrl: 'https://graph.facebook.com',
  headers: {
    Authorization: `Bearer ${facebookWorkplace.pageAccessToken}`,
    'User-Agent': 'EnabloSpotify/1.0',
  },
});

const postGroupReply = (id, queryString) => {
  facebookRequest({
    url: `/${id}/comments`,
    method: 'POST',
    qs: queryString,
  }, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      logger.info('Message sent to facebook successfully.');
    } else {
      logger.error(error, response.statusCode, response.statusMessage, body.error);
    }
  });
};

const sendReply = (to, text) => {
  postGroupReply(to, { message: text });
};

module.exports = {
  sendReply,
};
