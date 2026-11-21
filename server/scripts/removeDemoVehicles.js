require('dotenv').config({ path: require('node:path').resolve(__dirname, '../../.env') });
require('../config/dns');

const mongoose = require('mongoose');

async function removeDemoVehicles() {
  try {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('La rimozione dei dati demo è bloccata in produzione.');
    }
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI non è configurato nel file .env della FREE.');
    }

    await mongoose.connect(process.env.MONGO_URI, { dbName: 'pelusogroup_free' });
    const result = await mongoose.connection.collection('vehicles').deleteMany({ isDemo: true });
    console.log(`Rimosse ${result.deletedCount} auto dimostrative da pelusogroup_free.`);
  } catch (error) {
    console.error('Rimozione auto demo non riuscita:', error.message);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  }
}

removeDemoVehicles();
