// kafka/producer.js
const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'auth-service',
  brokers: ['kafka:9092'], // internal docker network
});

const producer = kafka.producer();

// Initialize producer connection at startup
let isConnected = false;

const getProducer = async () => {
  if (!isConnected) {
    try {
      await producer.connect();
      isConnected = true;
      console.log('Kafka producer connected');
    } catch (error) {
      console.error('Failed to connect Kafka producer:', error);
      throw error;
    }
  }
  return producer;
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  if (isConnected) {
    await producer.disconnect();
    isConnected = false;
  }
});

module.exports = { producer, getProducer };
