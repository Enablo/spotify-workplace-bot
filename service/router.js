const express = require('express');
const defaults = require('../routes/defaults');
const facebookWebhooks = require('../routes/facebook-webhooks');
const spotify = require('../routes/spotify');

const router = express.Router();

router.use('/', defaults);
router.use('/facebook', facebookWebhooks);
router.use('/spotify', spotify);

module.exports = router;
