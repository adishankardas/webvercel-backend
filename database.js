const { MongoClient } = require('mongodb');

// Connection URL
const url = 'mongodb://127.0.0.1:27017/my-website';

// Database Name
const dbName = 'my-website';

// Create a new MongoClient
const client = new MongoClient(url);

async function main() {
  try {
    // Connect to the MongoDB cluster
    await client.connect();

    console.log('Connected successfully to MongoDB server');
    
    // Get the database
    const db = client.db(dbName);
    
    // Perform actions on the database
    // For example, insert a document
    const collection = db.collection('articles');
    await collection.insertOne({ title: 'First Article', content: 'This is the first article.' });
    
    console.log('Document inserted successfully');
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
  } finally {
    // Close the connection
    await client.close();
  }
}

main();
