const crypto = require('crypto');
const config = require('config');
const request = require('request');
const EventEmitter = require('events');

// Load configuration objects
const facebookWorkplace = config.get('facebookWorkplace');
const webapp = config.get('webapp');

// Setup a default Facebook request object
const facebookRequest = request.defaults({
  baseUrl: 'https://graph.facebook.com',
  headers: {
    Authorization: `Bearer ${facebookWorkplace.pageAccessToken}`,
    'User-Agent': 'EnabloSpotify/1.0',
  },
});

// Used to verify messages from Facebook
const verify = (req, res, buf) => {
  const signature = req.headers['x-hub-signature'];

  if (!signature) {
    throw new Error('Signature is missing, unable to verify body');
  } else {
    const elements = signature.split('=');
    const signatureHash = elements[1];

    const expectedHash =
      crypto
        .createHmac('sha1', facebookWorkplace.appSecret)
        .update(buf)
        .digest('hex');

    if (signatureHash !== expectedHash) {
      throw new Error('Can\'t validate the request signature.');
    }
  }
};

// Enable subscriptions for an app
const enableSubscription = (cb) => {
  facebookRequest({
    url: '/me/subscribed_apps',
    method: 'POST',
    json: true,
  }, (err, response, body) => {
    if (err || !body.success) cb(new Error('Unable to enable subscriptions for this app.'));
    else cb(null);
  });
};

const subscribeWebhook = (object, fields, callbackUrl, cb) => {
  facebookRequest({
    url: '/app/subscriptions',
    method: 'POST',
    headers: {
      Authorization: `Bearer ${facebookWorkplace.appId}|${facebookWorkplace.appSecret}`,
    },
    qs: {
      object,
      fields,
      verify_token: facebookWorkplace.verifyToken,
      callback_url: `${webapp.publicUrl}${callbackUrl}`,
    },
    json: true,
  }, (err, response, body) => {
    if (err || !body.success) cb(new Error(`Unable to enable ${object} webhook for this app.`));
    else cb(null);
  });
};

// Setup webhook for page
const subscribePageWebhook = (cb) => {
  subscribeWebhook('page', 'messages,messaging_postbacks,mention', '/facebook/pages/webhook', (err) => {
    cb(err);
  });
};

// Setup webhook for groups
const subscribeGroupWebhook = (cb) => {
  subscribeWebhook('group', 'comments,posts', '/facebook/groups/webhook', (err) => {
    cb(err);
  });
};

// Configure getting started
const configureGettingStarted = (cb) => {
  facebookRequest({
    url: '/me/messenger_profile',
    method: 'POST',
    json: true,
    body: {
      get_started: {
        payload: 'GET_STARTED_BUTTON',
      },
    },
  }, (err, response, body) => {
    if (err || !body.result === 'success') cb(new Error('Unable to configure get started button.'));
    else cb(null);
  });
};

// Configure persitent menu
const configurePersistentMenu = (cb) => {
  const menu = {
    persistent_menu: [{
      locale: 'default',
      composer_input_disabled: true,
      call_to_actions: [{
        title: 'Enablo',
        type: 'web_url',
        url: 'https://www.enablo.com',
      }, {
        title: 'Configure Spotify',
        type: 'postback',
        payload: 'CONFIGURE_SPOTIFY',
      }],
    }],
  };

  facebookRequest({
    url: '/me/messenger_profile',
    method: 'POST',
    json: true,
    body: menu,
  }, (err, response, body) => {
    if (err || !body.result === 'success') cb(new Error('Unable to configure persistent menu.'));
    else cb(null);
  });
};

// Configure greeting menu
const configureGreetingText = (cb) => {
  const greetingText = {
    greeting: [{
      locale: 'default',
      text: 'Hello I\'m the Spotify bot, I help power Spotify Radio. If you\'re an admin use the persistent menu to configure me.',
    }],
  };

  facebookRequest({
    url: '/me/messenger_profile',
    method: 'POST',
    body: greetingText,
    json: true,
  }, (err, response, body) => {
    if (err || !body.result === 'success') cb(new Error('Unable to configure persistent menu.'));
    else cb(null);
  });
};

class FacebookWebhook extends EventEmitter {
  messageReceived(type, message) {
    this.emit('message', type, message);
  }
}

const webhook = new FacebookWebhook();

module.exports = {
  verify,
  webhook,
  enableSubscription,
  subscribePageWebhook,
  subscribeGroupWebhook,
  configureGettingStarted,
  configurePersistentMenu,
  configureGreetingText,
};
