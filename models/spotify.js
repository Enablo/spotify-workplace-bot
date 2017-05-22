const mongoose = require('mongoose');

mongoose.Promise = require('bluebird');

const Schema = mongoose.Schema;

const spotifySchema = new Schema({
  community: { type: String, index: true },
  userId: String,
  playlistId: String,
  accessToken: String,
  refreshToken: String,
  scope: String,
  expires: Date,
});

const Spotify = mongoose.model('Spotify', spotifySchema);

module.exports = Spotify;
