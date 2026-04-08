require('dotenv').config();

const express = require('express');
const cors = require('cors');
const InvertedIndex = require('./inverted-index').default || require('./inverted-index');
const MongoDBIndexer = require('./mongodb-indexer').default || require('./mongodb-indexer');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/indexes', express.static(path.join(__dirname, 'indexes')));

// ⭐ NEW: Serve Frontend (Static Files)
app.use(express.static(path.join(__dirname, '../public')));

// ⭐ NEW: Serve index.html at root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Initialize search engines
const invertedIndex = new InvertedIndex();
const documentStore = new Map();
let mongoIndexer = null;
let mongodbConnected = false;

// Search API (Inverted Index - Super Fast)
app.get('/search', async (req, res) => {
  try {
    const { q, field, boost, limit = 10 } = req.query;
    const boostFields = field ? { [field]: parseFloat(boost) || 2.0 } : {};
    
    const results = invertedIndex.search(q, { boostFields, limit: parseInt(limit) });
    
    // Local document store makes added docs searchable immediately
    let enrichedResults = results.map(([docId, score]) => {
      const stored = documentStore.get(docId);
      return {
        docId,
        score: Math.round(score * 100) / 100,
        title: stored?.title || docId,
        content: stored?.content || '',
        description: stored?.description || ''
      };
    });
    
    if (mongodbConnected && mongoIndexer) {
      const docIds = results.map(([docId]) => docId);
      const documents = await mongoIndexer.db.collection('documents').find({ 
        _id: { $in: docIds } 
      }).toArray();
      
      const docMap = new Map(documents.map(doc => [doc._id.toString(), doc]));
      
      enrichedResults = results.map(([docId, score]) => {
        const doc = docMap.get(docId);
        const localDoc = documentStore.get(docId);
        return {
          docId,
          score: Math.round(score * 100) / 100,
          title: doc?.title || localDoc?.title || docId,
          content: doc?.content || localDoc?.content || '',
          description: doc?.description || localDoc?.description || ''
        };
      });
    }
    
    res.json({
      query: q,
      mongodb: mongodbConnected,
      results: enrichedResults,
      total: results.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add Document API (Atlas + Inverted Index)
app.post('/index', async (req, res) => {
  try {
    const { title, content, description, fields = {} } = req.body;
    let docId = title?.trim() || Date.now().toString();
    if (documentStore.has(docId)) {
      docId = `${docId}-${Date.now()}`;
    }
    
    documentStore.set(docId, {
      title: title || docId,
      content: content || '',
      description: description || ''
    });
    
    // Always save to Inverted Index
    const fullText = `${title || ''} ${content || ''} ${description || ''}`.trim();
    await invertedIndex.addDocument(docId, fullText, fields);
    
    // Save to MongoDB if connected
    let mongoId = null;
    if (mongodbConnected && mongoIndexer) {
      const mongoDoc = await mongoIndexer.db.collection('documents').insertOne({
        _id: docId, title, content, description, createdAt: new Date()
      });
      mongoId = mongoDoc.insertedId.toString();
    }
    
    res.json({ 
      status: 'indexed', 
      docId,
      mongodb: mongodbConnected,
      mongoId 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health Check API
app.get('/health', async (req, res) => {
  let mongoCount = 0;
  if (mongodbConnected && mongoIndexer) {
    mongoCount = await mongoIndexer.db.collection('documents').countDocuments();
  }
    
  res.json({
    status: 'healthy',
    mongodbConnected,
    invertedIndex: { docs: invertedIndex.docCount, terms: invertedIndex.termCount },
    mongodb: { connected: mongodbConnected, docs: mongoCount }
  });
});

// Inverted Index data for frontend display
app.get('/index-data', (req, res) => {
  const simplifiedIndex = {};
  for (const [term, postings] of invertedIndex.index.entries()) {
    simplifiedIndex[term] = Array.from(new Set(postings.map(post => post.docId)));
  }
  res.json({
    docs: invertedIndex.docCount,
    terms: invertedIndex.termCount,
    index: simplifiedIndex
  });
});

// Sync API (MongoDB → Inverted Index)
app.post('/sync', async (req, res) => {
  if (!mongodbConnected || !mongoIndexer) {
    return res.status(400).json({ error: 'MongoDB not connected' });
  }
  try {
    await mongoIndexer.syncToInvertedIndex(invertedIndex);
    res.json({ status: 'synced' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log('🚀 Starting AI Search Engine...');
  
  // Load Inverted Index (always works)
  await invertedIndex.loadIndex();
  
  // Try MongoDB Atlas
  try {
    mongoIndexer = new MongoDBIndexer();
    await mongoIndexer.connect();
    mongodbConnected = true;
    console.log('✅ MongoDB Atlas Connected!');
    
    // Sync existing MongoDB documents to inverted index
    await mongoIndexer.syncToInvertedIndex(invertedIndex);
  } catch (error) {
    console.log('ℹ️ MongoDB Atlas offline - Inverted Index still works!');
    mongodbConnected = false;
  }
  
  console.log(`🌐 Frontend: http://localhost:${PORT}`);
  console.log(`📊 Backend APIs ready!`);
});




