// models/Playlist.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Playlist = sequelize.define('Playlist', {
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
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  mood: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  coverImage: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  timestamps: true,
  indexes: [
    { fields: ['userId'], name: 'playlist_user_id_idx' },
    { fields: ['isPublic', 'createdAt'], name: 'playlist_public_created_idx' },
    { fields: ['mood', 'isPublic'], name: 'playlist_mood_public_idx' },
  ],
});

module.exports = Playlist;
