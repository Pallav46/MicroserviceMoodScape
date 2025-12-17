const { Playlist, PlaylistTrack } = require('../models');
const { sequelize } = require('../config/database');

// Create a new playlist
exports.createPlaylist = async (req, res) => {
  const { name, description, mood, isPublic, coverImage } = req.body;
  const userId = req.userId; // Assuming middleware sets this

  if (!name) {
    return res.status(400).json({ message: 'Playlist name is required' });
  }

  try {
    const playlist = await Playlist.create({
      name,
      description,
      mood,
      isPublic: isPublic || false,
      coverImage,
      userId
    });

    res.status(201).json({
      message: 'Playlist created successfully',
      playlist
    });
  } catch (error) {
    console.error('Error creating playlist:', error);
    res.status(500).json({ message: 'Failed to create playlist' });
  }
};

// Get all playlists for a user
exports.getUserPlaylists = async (req, res) => {
  const userId = req.userId; // Assuming middleware sets this

  try {
    const playlists = await Playlist.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({ playlists });
  } catch (error) {
    console.error('Error fetching playlists:', error);
    res.status(500).json({ message: 'Failed to fetch playlists' });
  }
};

// Get a single playlist by ID with its tracks
exports.getPlaylistById = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId; // Assuming middleware sets this

  try {
    const playlist = await Playlist.findOne({
      where: { id },
      include: [{
        model: PlaylistTrack,
        order: [['position', 'ASC']]
      }]
    });

    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }

    // Check if user has access to this playlist
    if (!playlist.isPublic && playlist.userId !== userId) {
      return res.status(403).json({ message: 'You do not have access to this playlist' });
    }

    res.status(200).json({ playlist });
  } catch (error) {
    console.error('Error fetching playlist:', error);
    res.status(500).json({ message: 'Failed to fetch playlist' });
  }
};

// Update a playlist
exports.updatePlaylist = async (req, res) => {
  const { id } = req.params;
  const { name, description, mood, isPublic, coverImage } = req.body;
  const userId = req.userId; // Assuming middleware sets this

  try {
    const playlist = await Playlist.findOne({ where: { id, userId } });

    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found or you do not have permission to update it' });
    }

    // Update playlist
    await playlist.update({
      name: name || playlist.name,
      description: description !== undefined ? description : playlist.description,
      mood: mood !== undefined ? mood : playlist.mood,
      isPublic: isPublic !== undefined ? isPublic : playlist.isPublic,
      coverImage: coverImage || playlist.coverImage
    });

    res.status(200).json({
      message: 'Playlist updated successfully',
      playlist
    });
  } catch (error) {
    console.error('Error updating playlist:', error);
    res.status(500).json({ message: 'Failed to update playlist' });
  }
};

// Delete a playlist
exports.deletePlaylist = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId; // Assuming middleware sets this

  try {
    const playlist = await Playlist.findOne({ where: { id, userId } });

    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found or you do not have permission to delete it' });
    }

    // Delete playlist (cascade will delete tracks)
    await playlist.destroy();

    res.status(200).json({ message: 'Playlist deleted successfully' });
  } catch (error) {
    console.error('Error deleting playlist:', error);
    res.status(500).json({ message: 'Failed to delete playlist' });
  }
};

// Add a track to a playlist
exports.addTrackToPlaylist = async (req, res) => {
  const { id } = req.params;
  const { trackId, trackName, artistName, albumName, albumCover, duration } = req.body;
  const userId = req.userId; // Assuming middleware sets this

  if (!trackId || !trackName || !artistName) {
    return res.status(400).json({ message: 'Track ID, name, and artist are required' });
  }

  try {
    const playlist = await Playlist.findOne({ where: { id, userId } });

    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found or you do not have permission to modify it' });
    }

    // Get the highest position to add the track at the end
    const highestPosition = await PlaylistTrack.max('position', {
      where: { playlistId: id }
    }) || 0;

    // Add track to playlist
    const playlistTrack = await PlaylistTrack.create({
      playlistId: id,
      trackId,
      trackName,
      artistName,
      albumName,
      albumCover,
      duration,
      position: highestPosition + 1
    });

    res.status(201).json({
      message: 'Track added to playlist',
      track: playlistTrack
    });
  } catch (error) {
    console.error('Error adding track to playlist:', error);
    res.status(500).json({ message: 'Failed to add track to playlist' });
  }
};

// Remove a track from a playlist
exports.removeTrackFromPlaylist = async (req, res) => {
  const { id, trackId } = req.params;
  const userId = req.userId; // Assuming middleware sets this

  try {
    const playlist = await Playlist.findOne({ where: { id, userId } });

    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found or you do not have permission to modify it' });
    }

    // Find the track to remove
    const track = await PlaylistTrack.findOne({
      where: { playlistId: id, id: trackId }
    });

    if (!track) {
      return res.status(404).json({ message: 'Track not found in playlist' });
    }

    // Get the position of the track to be removed
    const removedPosition = track.position;

    // Start a transaction to ensure data consistency
    const transaction = await sequelize.transaction();

    try {
      // Delete the track
      await track.destroy({ transaction });

      // Update positions of all tracks that come after the removed track
      await PlaylistTrack.update(
        { position: sequelize.literal('position - 1') },
        {
          where: {
            playlistId: id,
            position: { [sequelize.Op.gt]: removedPosition }
          },
          transaction
        }
      );

      await transaction.commit();
      res.status(200).json({ message: 'Track removed from playlist' });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error removing track from playlist:', error);
    res.status(500).json({ message: 'Failed to remove track from playlist' });
  }
};

// Reorder tracks in a playlist
exports.reorderPlaylistTracks = async (req, res) => {
  const { id } = req.params;
  const { trackOrders } = req.body; // Array of {id, position}
  const userId = req.userId; // Assuming middleware sets this

  if (!Array.isArray(trackOrders) || trackOrders.length === 0) {
    return res.status(400).json({ message: 'Track orders must be a non-empty array' });
  }

  try {
    const playlist = await Playlist.findOne({ where: { id } });

    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }

    // Check if user owns this playlist
    if (playlist.userId !== userId) {
      return res.status(403).json({ message: 'You do not have permission to modify this playlist' });
    }

    // Start a transaction
    const transaction = await sequelize.transaction();

    try {
      // Validate that all tracks belong to this playlist
      const trackIds = trackOrders.map(t => t.id);
      const existingTracks = await PlaylistTrack.findAll({
        where: {
          id: trackIds,
          playlistId: id
        },
        attributes: ['id'],
        transaction
      });

      if (existingTracks.length !== trackIds.length) {
        await transaction.rollback();
        return res.status(400).json({ message: 'One or more track IDs do not belong to this playlist' });
      }

      // Use bulkCreate with updateOnDuplicate for better performance
      const updates = trackOrders.map(({ id: trackId, position }) => ({
        id: trackId,
        position,
        playlistId: id
      }));

      await PlaylistTrack.bulkCreate(updates, {
        updateOnDuplicate: ['position'],
        transaction
      });

      await transaction.commit();
      res.status(200).json({ message: 'Playlist tracks reordered successfully' });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error reordering playlist tracks:', error);
    res.status(500).json({ message: 'Failed to reorder playlist tracks' });
  }
};

// Get public playlists
exports.getPublicPlaylists = async (req, res) => {
  try {
    const playlists = await Playlist.findAll({
      where: { isPublic: true },
      order: [['createdAt', 'DESC']],
      limit: 20
    });

    res.status(200).json({ playlists });
  } catch (error) {
    console.error('Error fetching public playlists:', error);
    res.status(500).json({ message: 'Failed to fetch public playlists' });
  }
};

// Get playlists by mood
exports.getPlaylistsByMood = async (req, res) => {
  const { mood } = req.params;

  try {
    const playlists = await Playlist.findAll({
      where: { 
        mood,
        isPublic: true 
      },
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    res.status(200).json({ playlists });
  } catch (error) {
    console.error('Error fetching playlists by mood:', error);
    res.status(500).json({ message: 'Failed to fetch playlists by mood' });
  }
};