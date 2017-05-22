const config = require('config');
const querystring = require('querystring');
const request = require('request');
const Spotify = require('../models/spotify');
const moment = require('moment');
const logger = require('./logger');
const jsurl = require('jsurl');

// Configuration
const facebookWorkplace = config.get('facebookWorkplace');
const spotifyConfig = config.get('spotify');
const webapp = config.get('webapp');

const refreshTokens = (doc, cb) => {
  const tokenDoc = doc;
  const refreshToken = doc.refreshToken;
  let authorizationCode = `${spotifyConfig.clientId}:${spotifyConfig.clientSecret}`;
  authorizationCode = new Buffer(authorizationCode).toString('base64');
  request({
    url: 'https://accounts.spotify.com/api/token',
    method: 'POST',
    headers: {
      Authorization: `Basic ${authorizationCode}`,
    },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    },
  }, (requestErr, response, body) => {
    if (requestErr) {
      cb(requestErr);
    } else {
      const jsonBody = JSON.parse(body);
      tokenDoc.accessToken = jsonBody.access_token;
      tokenDoc.expires = moment().add(3600, 's').toDate();
      tokenDoc.save((saveErr) => {
        if (saveErr) cb(saveErr);
        else cb(null, jsonBody.access_token);
      });
    }
  });
};

const getAccessToken = (cb) => {
  Spotify.findOne({ community: facebookWorkplace.community }).exec((spotifyErr, doc) => {
    if (spotifyErr) {
      cb(spotifyErr);
    } else if (moment() > moment(doc.expires)) {
      // check to see if now is greater than expiry, we will need to refresh
      logger.info('Access token expired, getting new one via refresh token.');
      refreshTokens(doc, (refreshTokenErr, accessToken) => {
        if (refreshTokenErr) cb(refreshTokenErr);
        else cb(null, accessToken);
      });
    } else {
      cb(null, doc.accessToken);
    }
  });
};

const generateAuthorizeUrl = (state = {}) => {
  const qs = {
    client_id: spotifyConfig.clientId,
    response_type: 'code',
    redirect_uri: `${webapp.publicUrl}/spotify/service/callback`,
    scope: spotifyConfig.scopes.join(' '),
    state: jsurl.stringify(state),
  };

  return `https://accounts.spotify.com/authorize?${querystring.stringify(qs)}`;
};

const processCallback = (req, cb) => {
  if (req.query.code) {
    let authorizationCode = `${spotifyConfig.clientId}:${spotifyConfig.clientSecret}`;
    authorizationCode = new Buffer(authorizationCode).toString('base64');
    request({
      url: 'https://accounts.spotify.com/api/token',
      method: 'POST',
      headers: {
        Authorization: `Basic ${authorizationCode}`,
      },
      form: {
        grant_type: 'authorization_code',
        code: req.query.code,
        redirect_uri: `${webapp.publicUrl}/spotify/service/callback`,
      },
      json: true,
    }, (requestAuthErr, authResponse, authBody) => {
      if (requestAuthErr) {
        cb(requestAuthErr);
      } else {
        // Get the current users id
        request({
          url: 'https://api.spotify.com/v1/me',
          method: 'GET',
          headers: {
            Authorization: `Bearer ${authBody.access_token}`,
          },
          json: true,
        }, (requestMeErr, meResponse, meBody) => {
          if (requestMeErr) {
            cb(requestMeErr);
          } else {
            Spotify.findOneAndUpdate({ community: facebookWorkplace.community },
              {
                userId: meBody.id,
                accessToken: authBody.access_token,
                refreshToken: authBody.refresh_token,
                expires: moment().add(3600, 's').toDate(),
              }, { upsert: true }, (spotifyErr, doc) => {
                let state = {};
                if (req.query.state) state = jsurl.parse(req.query.state);
                cb(spotifyErr, doc, state);
              });
          }
        });
      }
    });
  } else {
    cb(new Error('Missing callback code or user rejected request.'));
  }
};

const me = (cb) => {
  getAccessToken((accessTokenErr, accessToken) => {
    if (accessTokenErr) {
      cb(accessTokenErr);
    } else {
      request({
        url: 'https://api.spotify.com/v1/me',
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }, (requestErr, response, body) => {
        if (requestErr) cb(requestErr);
        else cb(null, JSON.parse(body));
      });
    }
  });
};

const userPlaylists = (cb) => {
  getAccessToken((accessTokenErr, accessToken) => {
    if (accessTokenErr) {
      cb(accessTokenErr);
    } else {
      request({
        url: 'https://api.spotify.com/v1/me/playlists',
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        json: true,
      }, (requestErr, response, body) => {
        cb(requestErr, body);
      });
    }
  });
};

const addTracksToPlaylist = (tracksUri, cb) => {
  getAccessToken((accessTokenErr, accessToken) => {
    if (accessTokenErr) {
      cb(accessTokenErr);
    } else {
      Spotify.findOne({ community: facebookWorkplace.community }).exec((spotifyErr, doc) => {
        if (spotifyErr) {
          cb(spotifyErr);
        } else {
          request({
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            url: `https://api.spotify.com/v1/users/${doc.userId}/playlists/${doc.playlistId}/tracks`,
            method: 'POST',
            json: {
              uris: tracksUri,
            },
          }, (requestErr, response, body) => {
            if (requestErr) cb(requestErr);
            else cb(null, body);
          });
        }
      });
    }
  });
};

const removeTracksFromPlaylist = (tracksUri, cb) => {
  getAccessToken((accessTokenErr, accessToken) => {
    if (accessTokenErr) {
      cb(accessTokenErr);
    } else {
      Spotify.findOne({ community: facebookWorkplace.community }).exec((spotifyErr, doc) => {
        if (spotifyErr) {
          cb(spotifyErr);
        } else {
          request({
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            url: `https://api.spotify.com/v1/users/${doc.userId}/playlists/${doc.playlistId}/tracks`,
            method: 'DELETE',
            json: {
              uris: tracksUri,
            },
          }, (requestErr, response, body) => {
            if (requestErr) cb(requestErr);
            else cb(null, body);
          });
        }
      });
    }
  });
};

const setPlaylistId = (playlistId, cb) => {
  Spotify.update({ community: facebookWorkplace.community },
    { $set: { playlistId } }, (err, doc) => {
      cb(err, doc);
    });
};

module.exports = {
  generateAuthorizeUrl,
  processCallback,
  me,
  userPlaylists,
  addTracksToPlaylist,
  removeTracksFromPlaylist,
  setPlaylistId,
};
