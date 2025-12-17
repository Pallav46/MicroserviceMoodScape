// models/PlaylistTrack.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PlaylistTrack = sequelize.define('PlaylistTrack', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  playlistId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'Reference to Playlist',
  },
  trackId: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Spotify track ID',
  },
  trackName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  artistName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  albumName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  albumCover: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Duration in milliseconds',
  },
  position: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
}, {
  timestamps: true,
  indexes: [
    { fields: ['playlistId'], name: 'playlist_track_playlist_id_idx' },
    { fields: ['playlistId', 'position'], name: 'playlist_track_playlist_position_idx' },
  ],
});

module.exports = PlaylistTrack;
