// models/Like.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Like = sequelize.define('Like', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'User ID from auth service',
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
  likedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  timestamps: true,
  indexes: [
    { fields: ['userId'], name: 'like_user_id_idx' },
    { fields: ['userId', 'trackId'], unique: true, name: 'like_user_track_unique_idx' },
    { fields: ['likedAt'], name: 'like_liked_at_idx' },
  ],
});

module.exports = Like;
