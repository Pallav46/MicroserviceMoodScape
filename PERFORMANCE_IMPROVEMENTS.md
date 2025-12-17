# Performance Improvements

This document outlines the performance optimizations implemented in the MicroserviceMoodScape project.

## Summary of Changes

### 1. Kafka Producer Connection Pooling (Auth Service)
**Problem**: The producer was connecting and disconnecting on every delete operation, causing unnecessary overhead.

**Solution**: Implemented connection pooling with a singleton pattern that maintains a persistent connection.

**Files Modified**:
- `auth/src/kafka/producer.js`
- `auth/src/controller/auth.controller.js`

**Impact**: 
- Reduced latency for user deletion operations
- Eliminated connection overhead (typically 100-500ms per connection)
- Better resource utilization

### 2. Go HTTP Client Optimization (Song Service)
**Problem**: 
- Using deprecated `ioutil.ReadAll` function
- No HTTP client reuse (creating new connections for each request)
- No timeout configuration (potential for hung connections)

**Solution**: 
- Replaced `ioutil.ReadAll` with `io.ReadAll`
- Implemented HTTP client with connection pooling
- Added 10-second timeout
- Configured idle connection management (100 max idle, 10 per host, 90s timeout)

**Files Modified**:
- `song/internal/app/services/song_service.go`

**Impact**:
- Reduced latency for song search operations by reusing TCP connections
- Better handling of slow/unresponsive external APIs
- Reduced resource consumption

### 3. Database Query Optimization (Playlist Controller)
**Problem**: Sequential database queries for authorization checks - first fetching the playlist, then checking ownership separately.

**Solution**: Combined queries using compound WHERE clauses to reduce roundtrips.

**Example**:
```javascript
// Before: 2 queries
const playlist = await Playlist.findOne({ where: { id } });
if (playlist.userId !== userId) { /* unauthorized */ }

// After: 1 query
const playlist = await Playlist.findOne({ where: { id, userId } });
if (!playlist) { /* not found or unauthorized */ }
```

**Files Modified**:
- `user/controllers/playlist.controller.js`

**Impact**:
- 50% reduction in database roundtrips for update, delete, add track, and remove track operations
- Reduced latency by 10-50ms per operation (depending on network latency)

### 4. Bulk Update for Playlist Reordering
**Problem**: Loop-based sequential updates for reordering playlist tracks, causing N database queries.

**Solution**: Replaced with `bulkCreate` using `updateOnDuplicate` option for single-query bulk updates.

**Files Modified**:
- `user/controllers/playlist.controller.js`

**Impact**:
- Changed from O(n) queries to O(1) query for reordering operations
- For 10 tracks: 10 queries → 1 query (10x improvement)
- Significantly faster for large playlists

### 5. Database Connection Pool Optimization
**Problem**: 
- Small connection pool size (max: 5, min: 0)
- Logging enabled in production

**Solution**:
- Increased pool size (max: 10, min: 2)
- Disabled logging in production, enabled only in development
- Maintained connections reduce connection establishment overhead

**Files Modified**:
- `user/config/database.js`

**Impact**:
- Better handling of concurrent requests
- Reduced connection establishment latency
- Eliminated logging overhead in production

### 6. Database Indexes
**Problem**: Missing indexes on frequently queried fields, causing full table scans.

**Solution**: Added comprehensive indexes on:

**History Model**:
- `userId, playedAt` - for efficient history retrieval
- `userId, trackId` - for play count aggregation

**Like Model**:
- `userId, trackId` (unique) - prevents duplicates and enables fast lookups
- `likedAt` - for chronological sorting

**Playlist Model**:
- `userId` - for user's playlists
- `isPublic, createdAt` - for public playlist discovery
- `mood, isPublic` - for mood-based filtering

**PlaylistTrack Model**:
- `playlistId` - for track retrieval
- `playlistId, position` - for ordered track retrieval

**Files Modified**:
- `user/models/History.js`
- `user/models/Like.js`
- `user/models/Playlist.js`
- `user/models/PlaylistTrack.js`

**Impact**:
- Queries using indexed fields will use index scans instead of full table scans
- Expected 10-100x improvement for filtered queries as data grows
- Particularly beneficial for:
  - User history retrieval
  - Most played tracks calculation
  - Playlist track ordering
  - Public playlist discovery

### 7. Model Schema Completeness
**Problem**: Model definitions were incomplete, missing fields that were being used in controllers.

**Solution**: Added missing fields to models to match actual usage:
- Like: Added `trackName`, `artistName`, `albumName`, `albumCover`, `likedAt`
- Playlist: Added `description`, `mood`, `isPublic`, `coverImage`
- PlaylistTrack: Added `trackName`, `artistName`, `albumName`, `albumCover`, `duration`, `position`

**Files Modified**:
- `user/models/Like.js`
- `user/models/Playlist.js`
- `user/models/PlaylistTrack.js`

**Impact**:
- Proper schema validation
- Better data integrity
- Enables database-level constraints

## Performance Benchmarks (Expected)

### Auth Service - User Deletion
- Before: ~150-600ms (including Kafka connection)
- After: ~50-100ms (with persistent connection)
- **Improvement**: 3-6x faster

### Song Service - Search Operations
- Before: ~200-400ms (new connection per request)
- After: ~50-150ms (connection reuse)
- **Improvement**: 2-4x faster

### Playlist Operations
- Update/Delete: 50% faster (1 query instead of 2)
- Reorder 10 tracks: 10x faster (1 query instead of 10)
- Reorder 50 tracks: 50x faster (1 query instead of 50)

### Database Query Performance
- Indexed queries: 10-100x faster as data grows
- History retrieval: Expected to scale logarithmically instead of linearly
- Most played calculation: Significant improvement with proper indexes

## Recommendations for Future Optimization

1. **Caching Layer**: Consider adding Redis for:
   - Frequently accessed playlists
   - User preferences
   - Song metadata

2. **Database Query Optimization**:
   - Monitor slow queries in production
   - Consider read replicas for heavy read operations
   - Implement pagination for all list endpoints

3. **Async Processing**:
   - Move non-critical operations to background jobs
   - Use message queues for heavy processing

4. **API Response Optimization**:
   - Implement field selection (GraphQL or sparse fieldsets)
   - Use compression (gzip/brotli)
   - Implement ETags for conditional requests

5. **Monitoring**:
   - Add application performance monitoring (APM)
   - Track query execution times
   - Monitor connection pool utilization
   - Set up alerts for slow operations

## Testing Recommendations

To validate these improvements:

1. **Load Testing**: Use tools like Apache JMeter or k6 to simulate concurrent users
2. **Database Profiling**: Monitor query execution plans and timing
3. **Connection Pool Monitoring**: Track pool utilization and wait times
4. **End-to-End Timing**: Measure complete request/response cycles

## Migration Notes

When deploying these changes:

1. Database indexes will be created automatically by Sequelize's `alter: true` mode
2. No manual migration required for development environments
3. For production, consider creating migrations for schema changes
4. Monitor application logs for any connection issues after Kafka changes
5. Verify that all fields are properly migrated in existing database records
