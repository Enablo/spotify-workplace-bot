const config = require('config');
const logger = require('../lib/logger');
const app = require('./app');
const https = require('https');
const fs = require('fs');
const db = require('../lib/db');  // eslint-disable-line no-unused-vars
const spotifyGroupBot = require('./bots/spotify-group');
const spotifyMessengerBot = require('./bots/spotify-messenger');
const setup = require('./setup');

// Configurations
const webapp = config.get('webapp');

const startServices = () => {
  // Start the two seperate bot services and configure Workplace
  setup.configureFacebookWorkplace();
  spotifyGroupBot.listen();
  spotifyMessengerBot.listen();
};

const startApp = () => {
  if (webapp.developmentKey && webapp.developmentCert) {
    // Run with HTTPS support for local development
    const httpsOptions = {
      key: fs.readFileSync(webapp.developmentKey),
      cert: fs.readFileSync(webapp.developmentCert),
    };

    https.createServer(httpsOptions, app).listen(webapp.port, () => {
      logger.info(`HTTPS development server running at ${webapp.port}`);
      startServices();
    });
  } else {
    // Run with HTTP and use a reverse proxy to provide HTTPS
    app.listen(webapp.port, () => {
      logger.info(`HTTP server running at ${webapp.port}`);
      startServices();
    });
  }
};

startApp();
