const mongoose = require('mongoose');

mongoose.Promise = require('bluebird');

const Schema = mongoose.Schema;

const groupSpotifySchema = new Schema({
  group: String,
  post: { type: String, index: true },
  spotifyUrl: String,
});

const GroupSpotify = mongoose.model('GroupSpotify', groupSpotifySchema);

module.exports = GroupSpotify;
