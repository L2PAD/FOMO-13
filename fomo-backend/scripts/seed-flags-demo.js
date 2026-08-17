require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
  const uri = process.env.DB_URL || process.env.MONGO_URL;
  const dbName = process.env.DB_NAME || undefined;
  await mongoose.connect(uri, dbName ? { dbName } : {});
  const db = mongoose.connection.db;
  const flags = db.collection('fomo_v2_entity_flags');

  const anyUser = await db.collection('users').findOne({});
  if (!anyUser) { console.log('No users found — skip'); await mongoose.disconnect(); process.exit(0); }
  const uid = anyUser._id;

  const demo = [
    { entityType: 'market_project', entityId: 'demo-project-arbitrum', flagType: 'red', title: '[DEMO] Подозрительная разблокировка токенов', description: 'Команда провела крупную незапланированную разблокировку. Требует проверки модератором.', sourceUrl: 'https://example.com/unlock' },
    { entityType: 'backer', entityId: 'demo-fund-alpha', flagType: 'green', title: '[DEMO] Сильный трек-рекорд фонда', description: 'Фонд поддержал несколько успешных проектов — положительный сигнал.', sourceUrl: 'https://example.com/fund' },
    { entityType: 'person', entityId: 'demo-person-founder', flagType: 'yellow', title: '[DEMO] Спорная активность в соцсетях', description: 'Основатель делал противоречивые заявления — на усмотрение модерации.', sourceUrl: 'https://example.com/person' },
  ];

  let inserted = 0;
  for (const d of demo) {
    const exists = await flags.findOne({ entityId: d.entityId, description: d.description });
    if (exists) continue;
    await flags.insertOne({
      ...d,
      status: 'pending',
      submittedByUserId: uid,
      xpDelta: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    inserted++;
  }
  console.log('Seeded pending demo flags:', inserted);
  await mongoose.disconnect();
  process.exit(0);
})().catch((e) => { console.error('seed failed:', e.message); process.exit(1); });
