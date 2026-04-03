require('dotenv').config();
const { MongoClient } = require('mongodb');

class MongoDBIndexer {
  constructor() {
    this.uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    this.dbName = process.env.MONGODB_DB_NAME || 'search_engine';
    this.client = null;
    this.db = null;
  }

  async connect() {
    if (!this.uri) {
      throw new Error('MONGODB_URI or MONGO_URI must be set in .env or environment variables');
    }

    this.client = new MongoClient(this.uri);
    await this.client.connect();

    this.db = this.client.db(this.dbName);

    await this.db.collection('documents').createIndex({
      title: 'text', content: 'text', description: 'text'
    }, {
      weights: { title: 10, content: 5, description: 1 },
      name: 'full_text_search'
    });

    console.log('✅ MongoDB Connected:', this.uri.includes('mongodb+srv') ? 'Atlas/SRV' : 'local');
    return this.db;
  }

  async searchMongo(query) {
    return await this.db.collection('documents').find({
      $text: { $search: query }
    }).toArray();
  }

  async syncToInvertedIndex(index) {
    const cursor = this.db.collection('documents').find({});
    let count = 0;
    await cursor.forEach(doc => {
      const text = `${doc.title || ''} ${doc.content || ''} ${doc.description || ''}`.trim();
      index.addDocument(doc._id.toString(), text, {});
      count++;
    });
    console.log(`✅ Synced ${count} docs from Atlas`);
  }
}

module.exports = MongoDBIndexer;