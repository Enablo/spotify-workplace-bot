const express = require('express');
const logger = require('../lib/logger');
const spotify = require('../lib/spotify');
const facebookMessenger = require('../lib/facebook-messenger');

const router = new express.Router();

router.get('/service/callback', (req, res) => {
  spotify.processCallback(req, (callbackErr, doc, state) => {
    if (callbackErr) {
      // An error occured, send 500
      logger.error(callbackErr);
      res.sendStatus(500);
    } else if (state.postback && state.postback === 'SPOTIFY_AUTH_COMPLETE') {
      // Configuring selected playlist
      spotify.userPlaylists((err, playlists) => {
        if (err) {
          facebookMessenger.sendMessage(state.sender, 'There was an error retrieving your playlists, please try again.');
        } else {
          facebookMessenger.sendMessage(state.sender, 'Now select the playlist you want to use when adding songs from Facebook Workplace.');

          // Show the first 10 playlists in Spotify, works for us. Will need to expand later.
          const elements = [];
          const itemLength = (playlists.items.length > 10) ? 10 : playlists.items.length;
          for (let i = 0; i < itemLength; i += 1) {
            const item = playlists.items[i];
            elements.push({
              title: item.name,
              image_url: item.images[0].url,
              buttons: [{
                type: 'postback',
                title: 'Use Playlist',
                payload: `SPOTIFY_PLAYLIST_${item.id}`,
              }],
            });
          }

          // Send the payload to Facebook
          facebookMessenger.sendTemplatePayload(state.sender, {
            template_type: 'generic',
            elements,
          });
        }
      });

      res.send('Auth complete, you can now close this tab/window.');
    } else if (state.next) {
      // Provide next so redirect to it
      res.redirect(state.next);
    } else {
      // Else just sent a 200 status
      res.sendStatus(200);
    }
  });
});

module.exports = router;
