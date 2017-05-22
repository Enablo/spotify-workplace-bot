const express = require('express');
const bodyParser = require('body-parser');
const router = require('./router');
const facebookWebhooks = require('../lib/facebook-webhooks');

const app = express();

app.use(bodyParser.json({ verify: facebookWebhooks.verify }));

app.use('/', router);

module.exports = app;
