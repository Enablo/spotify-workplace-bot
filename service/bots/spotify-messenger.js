const facebookWebhooks = require('../../lib/facebook-webhooks');
const facebookMessenger = require('../../lib/facebook-messenger');
const logger = require('../../lib/logger');
const config = require('config');
const spotify = require('../../lib/spotify');

// Configuration
const spotifyConfig = config.get('spotify');

const listen = () => {
  logger.info('Started Messenger bot');
  facebookWebhooks.webhook.on('message', (type, message) => {
    if (type === 'page' && message.object === 'page') {
      message.entry.forEach((entry) => {
        entry.messaging.forEach((msg) => {
          // Handle a postback
          if (msg.postback) {
            logger.info(`Receive postback ${msg.postback.payload} from Facebook`);
            if (msg.postback.payload === 'GET_STARTED_BUTTON') {
              // Start get started workflow
              facebookMessenger.sendMessage(msg.sender.id, 'Hi I\'m Enablo Spotify, I help power Enablo Radio. If you\'re an admin, use the persistnt menu to configure me.');
            } else if (msg.postback.payload === 'CONFIGURE_SPOTIFY' && spotifyConfig.workplaceAdmins.includes(msg.sender.id)) {
              // Start configuration flow
              facebookMessenger.sendTemplatePayload(msg.sender.id, {
                template_type: 'button',
                text: 'First if you\'re not already authenticated with Spotify, you will be asked to authenticate and then choose a playlist to save songs to.',
                buttons: [{
                  type: 'web_url',
                  title: 'Configure',
                  url: spotify.generateAuthorizeUrl({ postback: 'SPOTIFY_AUTH_COMPLETE', sender: msg.sender.id }),
                }],
              });
            } else if (msg.postback.payload.indexOf('SPOTIFY_PLAYLIST_') > -1 && spotifyConfig.workplaceAdmins.includes(msg.sender.id)) {
              // Playlist card selection
              const playlistId = msg.postback.payload.substring('SPOTIFY_PLAYLIST_'.length, msg.postback.payload.length);
              spotify.setPlaylistId(playlistId, (err) => {
                if (err) facebookMessenger.sendMessage(msg.sender.id, 'An error occured, please try again.');
                else facebookMessenger.sendMessage(msg.sender.id, 'Configuration is complete, enjoy using the integration.');
              });
            } else {
              // Catch all for now
              facebookMessenger.sendMessage(msg.sender.id, 'An error occured, please make sure you are permitted to use me.');
            }
          }
        });
      });
    }
  });
};

module.exports = {
  listen,
};
