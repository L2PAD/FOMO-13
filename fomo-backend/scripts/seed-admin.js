/* One-off admin seed for local preview */
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const url = process.env.DB_URL || 'mongodb://localhost:27017';
const dbName = process.env.DB_NAME || 'fomo_dev';
const email = process.env.SEED_ADMIN_EMAIL || 'admin@fomo.local';
const password = process.env.SEED_ADMIN_PASSWORD || 'Admin@12345';
const salt = Number(process.env.SALT || '10');

(async () => {
  const client = new MongoClient(url);
  await client.connect();
  const db = client.db(dbName);
  const users = db.collection('users');

  const hash = await bcrypt.hash(password, salt);

  // pick a unique fomoId
  const last = await users.find({}).sort({ fomoId: -1 }).limit(1).toArray();
  const fomoId = last.length && Number.isFinite(last[0].fomoId) ? last[0].fomoId + 1 : 1;

  const doc = {
    fomoId,
    email,
    name: 'Admin',
    username: 'admin',
    password: hash,
    wallet: '',
    role: ['admin'],
    isActive: true,
    is2FAEnabled: false,
    banned: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const res = await users.updateOne(
    { email },
    { $set: { password: hash, role: ['admin'], isActive: true, is2FAEnabled: false }, $setOnInsert: { fomoId, name: 'Admin', username: 'admin', wallet: '', banned: false, createdAt: new Date() } },
    { upsert: true }
  );

  const saved = await users.findOne({ email }, { projection: { password: 0 } });
  console.log('Admin upserted:', JSON.stringify(saved));
  console.log('Login =>', email, '/', password);
  await client.close();
})().catch((e) => { console.error(e); process.exit(1); });
