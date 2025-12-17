// models/History.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const History = sequelize.define('History', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'References the user ID from auth service',
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
  playedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  playDuration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Duration played in milliseconds',
  },
}, {
  timestamps: true,
  indexes: [
    { fields: ['userId'], name: 'history_user_id_idx' },
    { fields: ['userId', 'playedAt'], name: 'history_user_played_at_idx' },
    { fields: ['userId', 'trackId'], name: 'history_user_track_idx' },
  ],
});

module.exports = History;
