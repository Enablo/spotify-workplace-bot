const express = require('express');
const config = require('config');
const facebookWebhooks = require('../lib/facebook-webhooks');

const router = new express.Router();

// Configurations
const facebookWorkplace = config.get('facebookWorkplace');

const verifcation = (req, res) => {
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === facebookWorkplace.verifyToken) {
    res.send(req.query['hub.challenge']);
  } else {
    res.sendStatus(403);
  }
};

router.get('/groups/webhook', (req, res) => {
  verifcation(req, res);
});

router.post('/groups/webhook', (req, res) => {
  facebookWebhooks.webhook.messageReceived('group', req.body);
  res.sendStatus(200);
});

router.get('/pages/webhook', (req, res) => {
  verifcation(req, res);
});

router.post('/pages/webhook', (req, res) => {
  facebookWebhooks.webhook.messageReceived('page', req.body);
  res.sendStatus(200);
});

module.exports = router;
