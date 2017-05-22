const logger = require('./logger');
const config = require('config');
const request = require('request');

// Configure
const facebookWorkplace = config.get('facebookWorkplace');

// Setup a default Facebook request object
const facebookRequest = request.defaults({
  baseUrl: 'https://graph.facebook.com',
  headers: {
    Authorization: `Bearer ${facebookWorkplace.pageAccessToken}`,
    'User-Agent': 'EnabloSpotify/1.0',
  },
});

const send = (to, body) => {
  const messageBody = Object.assign({
    recipient: {
      id: to,
    },
  }, body);

  facebookRequest({
    url: '/me/messages',
    method: 'POST',
    json: true,
    body: messageBody,
  }, (err, response, responseBody) => {
    if (err || responseBody.error) logger.error(err, responseBody.error);
    else logger.info('Message sent to Facebook');
  });
};

const sendMessage = (to, message) => {
  facebookRequest({
    url: '/me/messages',
    method: 'POST',
    json: true,
    body: {
      recipient: {
        id: to,
      },
      message: {
        text: message,
      },
    },
  }, (err, response, body) => {
    if (err || body.error) logger.error(err, body.error);
    else logger.info('Message sent to Facebook');
  });
};

const sendTemplatePayload = (to, payload) => {
  facebookRequest({
    url: '/me/messages',
    method: 'POST',
    json: true,
    body: {
      recipient: {
        id: to,
      },
      message: {
        attachment: {
          type: 'template',
          payload,
        },
      },
    },
  }, (err, response, body) => {
    if (err || body.error) logger.error(err, body.error);
    else logger.info('Message sent to Facebook');
  });
};

module.exports = {
  sendTemplatePayload,
  sendMessage,
  send,
};
