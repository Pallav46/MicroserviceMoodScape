// db.js
const { Sequelize } = require('sequelize');
console.log('process.env.POSTGRES_HOST', process.env.POSTGRES_HOST);

const sequelize = new Sequelize(
  process.env.POSTGRES_DB || 'auth_database', // Database name
  process.env.POSTGRES_USER || 'your_username', // Username
  process.env.POSTGRES_PASSWORD || 'your_password', // Password
  {
    
    host: process.env.POSTGRES_HOST || 'localhost', // Docker container hostname
    port: process.env.POSTGRES_PORT || 5432, // Default PostgreSQL port
    dialect: 'postgres',
    logging: false, // Disable logging; set to console.log for debugging
  }
);

sequelize
  .authenticate()
  .then(() => console.log('Database connection established.'))
  .catch((err) => console.error('Unable to connect to the database:', err));

module.exports = sequelize;
