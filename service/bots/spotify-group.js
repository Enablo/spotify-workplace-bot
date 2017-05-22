const facebookWebhooks = require('../../lib/facebook-webhooks');
const facebookGroups = require('../../lib/facebook-groups');
const GroupSpotify = require('../../models/group-spotify');
const logger = require('../../lib/logger');
const config = require('config');
const spotify = require('../../lib/spotify');

// Configurations
const spotifyConfig = config.get('spotify');

const listen = () => {
  logger.info('Started Group bot');
  facebookWebhooks.webhook.on('message', (type, message) => {
    if (type === 'group') {
      message.entry.forEach((entry) => {
        const groupId = entry.id;

        // Only listen to messages from the specified Radio groups
        if (spotifyConfig.workplaceGroups.includes(groupId)) {
          entry.changes.forEach((change) => {
            if (change.field === 'posts') {
              if (change.value.type === 'status' && change.value.target_type === 'group' && change.value.verb === 'add') {
                // A new post was just added to a supported group
                // Check to see if the post has a Spotify track URL
                const REGEX = /(https:\/\/open.spotify.com\/track\/([a-zA-Z0-9]{22}))/g;
                const match = REGEX.exec(change.value.message);

                if (match.length >= 3) {
                  const trackId = match[2];

                  // Adding a status to group
                  const groupSpotify = new GroupSpotify({
                    group: groupId,
                    post: change.value.post_id,
                    spotifyUrl: change.value.message,
                  });

                  // Sometimes if the user submits to quick, Facebook doesn't get a chance
                  // to generate the attachment.
                  let songDescription = 'a song';
                  if (change.value && change.value.attachments &&
                    change.value.attachments && change.value.attachments.data &&
                    change.value.attachments.data.length > 0) {
                    songDescription = change.value.attachments.data[0].description;
                  }

                  // Connect to Spotify and add the song to the playlist, also update Mongo
                  // to track the songs.
                  spotify.addTracksToPlaylist([`spotify:track:${trackId}`], (addTrackErr, response) => {
                    if (addTrackErr) {
                      logger.error('Error saving song to playlist.', addTrackErr);
                    } else {
                      logger.info('Successfully updated playlist on Spotify', response);
                      groupSpotify.save((groupSpotifyErr) => {
                        if (groupSpotifyErr) {
                          logger.error('Error saving group reference to database.', groupSpotifyErr);
                        } else {
                          logger.info('Added group reference to database.');
                          facebookGroups.sendReply(change.value.post_id, `I've added ${songDescription} to the Enablo Radio playlist.`);
                        }
                      });
                    }
                  });
                }
              } else if (change.value.target_type === 'group' && change.value.verb === 'delete') {
                // A post was just deleted from one of the groups
                // Look up Mongo and get the URL so we can get the track ID and
                // remove from Spotify Playlist
                GroupSpotify.findOne({ post: change.value.post_id }, (groupSpotifyFindErr, doc) => {
                  if (groupSpotifyFindErr || doc === null) {
                    logger.error('Error retrieving spotify doc.', groupSpotifyFindErr);
                  } else {
                    const REGEX = /(https:\/\/open.spotify.com\/track\/([a-zA-Z0-9]{22}))/g;
                    const match = REGEX.exec(doc.spotifyUrl);
                    const trackId = match[2];

                    spotify.removeTracksFromPlaylist([`spotify:track:${trackId}`], (removeTrackErr, response) => {
                      if (removeTrackErr) {
                        logger.error('Error removing track from playlist', removeTrackErr);
                      } else {
                        logger.info('Successfully updated playlist on Spotify', response);
                        GroupSpotify.remove({ post: change.value.post_id },
                          (groupSpotifyRemoveErr) => {
                            if (groupSpotifyRemoveErr) logger.error('Error removing group reference to database.', groupSpotifyRemoveErr);
                            else logger.info('Removed group reference to database.');
                          });
                      }
                    });
                  }
                });
              }
            }
          });
        }
      });
    }
  });
};

module.exports = {
  listen,
};
