const mongoose = require('mongoose');
require('mongoose-moment')(mongoose);
const config = require('config');
const logger = require('./logger');

// Configurations
const database = config.get('database');

mongoose.Promise = require('bluebird');

mongoose.connect(database.mongo, () => logger.log('info', 'Connected to mongo'));

module.exports = {
  connection: mongoose.connection,
};
