require('dotenv').config({ path: require('node:path').resolve(__dirname, '../../.env') });
require('../config/dns');

const crypto = require('node:crypto');
const fsNative = require('node:fs');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const mongoose = require('mongoose');

const picturesRoot = process.env.PICTURES_DIR
  ? path.resolve(process.env.PICTURES_DIR)
  : path.join(os.homedir(), 'Pictures');
const imageDirectory = path.resolve(__dirname, '../../client/public/images/cars');
const vehicles = [
  {
    key: 'pictures:bmw-serie-6',
    folder: 'bmw-serie-6',
    image: 'OIP-3006360210.jpg',
    brand: 'BMW',
    model: 'Serie 6',
    year: 2018,
    price: 31900,
    mileage: 72000,
    fuel: 'Benzina',
    bodyType: 'Coupé',
    transmission: 'Automatico',
    engine: '3.0 benzina',
    engineDisplacementCc: 2996,
    powerCv: 320,
    drivetrain: 'Posteriore',
    doors: 4,
    seats: 5,
    condition: 'Demo · dato indicativo',
    features: ['Navigatore', 'Sensori di parcheggio', 'Climatizzatore automatico'],
  },
  {
    key: 'pictures:chrysler-300c',
    folder: 'crysler',
    image: 'OIP-259555904.jpg',
    brand: 'Chrysler',
    model: '300C',
    year: 2012,
    price: 11900,
    mileage: 146000,
    fuel: 'Diesel',
    bodyType: 'Berlina',
    transmission: 'Automatico',
    engine: '3.0 V6 diesel',
    engineDisplacementCc: 2987,
    powerCv: 218,
    drivetrain: 'Posteriore',
    doors: 4,
    seats: 5,
    condition: 'Demo · dato indicativo',
    features: ['Interni in pelle', 'Climatizzatore automatico', 'Cruise control'],
  },
  {
    key: 'pictures:mercedes-classe-c',
    folder: 'mercedes-class-c',
    image: 'OIP-2007412970.jpg',
    brand: 'Mercedes-Benz',
    model: 'Classe C',
    year: 2019,
    price: 28900,
    mileage: 61000,
    fuel: 'Diesel',
    bodyType: 'Berlina',
    transmission: 'Automatico',
    engine: '2.0 diesel',
    engineDisplacementCc: 1950,
    powerCv: 194,
    drivetrain: 'Posteriore',
    doors: 4,
    seats: 5,
    condition: 'Demo · dato indicativo',
    features: ['Navigatore', 'Sensori di parcheggio', 'Climatizzatore automatico'],
  },
  {
    key: 'pictures:mercedes-cls',
    folder: 'mercedes-cls',
    image: 'OIP-1804468788.jpg',
    brand: 'Mercedes-Benz',
    model: 'CLS',
    year: 2017,
    price: 32900,
    mileage: 79000,
    fuel: 'Diesel',
    bodyType: 'Coupé 4 porte',
    transmission: 'Automatico',
    engine: '3.0 diesel',
    engineDisplacementCc: 2987,
    powerCv: 258,
    drivetrain: 'Posteriore',
    doors: 4,
    seats: 5,
    condition: 'Demo · dato indicativo',
    features: ['Interni in pelle', 'Navigatore', 'Fari LED'],
  },
  {
    key: 'pictures:mercedes-glc',
    folder: 'mercedes-glc',
    image: 'OIP-17142804.jpg',
    brand: 'Mercedes-Benz',
    model: 'GLC',
    year: 2020,
    price: 36900,
    mileage: 54000,
    fuel: 'Diesel',
    bodyType: 'SUV',
    transmission: 'Automatico',
    engine: '2.0 diesel',
    engineDisplacementCc: 1950,
    powerCv: 194,
    drivetrain: 'Integrale',
    doors: 5,
    seats: 5,
    condition: 'Demo · dato indicativo',
    features: ['Navigatore', 'Telecamera posteriore', 'Portellone elettrico'],
  },
  {
    key: 'pictures:fiat-punto-evo',
    folder: 'punto-evo',
    image: 'OIP-1735180418.jpg',
    brand: 'Fiat',
    model: 'Punto Evo',
    year: 2012,
    price: 6900,
    mileage: 128000,
    fuel: 'Benzina',
    bodyType: 'Compatta',
    transmission: 'Manuale',
    engine: '1.4 benzina',
    engineDisplacementCc: 1368,
    powerCv: 77,
    drivetrain: 'Anteriore',
    doors: 5,
    seats: 5,
    condition: 'Demo · dato indicativo',
    features: ['Climatizzatore', 'Radio CD', 'Servosterzo'],
  },
];

async function prepareVehicles() {
  const prepared = [];
  await fs.mkdir(imageDirectory, { recursive: true });

  for (const vehicle of vehicles) {
    const sourcePath = path.join(picturesRoot, vehicle.folder, vehicle.image);
    const contents = await fs.readFile(sourcePath);
    if (contents.length === 0) throw new Error(`Foto vuota: ${vehicle.folder}\\${vehicle.image}`);

    const hash = crypto.createHash('sha256').update(contents).digest('hex').slice(0, 32);
    const extension = path.extname(vehicle.image).toLowerCase();
    const filename = `pictures-${hash}${extension}`;
    const destination = path.join(imageDirectory, filename);

    try {
      await fs.copyFile(sourcePath, destination, fsNative.constants.COPYFILE_EXCL);
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
    }

    prepared.push({
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      price: vehicle.price,
      mileage: vehicle.mileage,
      fuel: vehicle.fuel,
      bodyType: vehicle.bodyType,
      transmission: vehicle.transmission,
      engine: vehicle.engine,
      engineDisplacementCc: vehicle.engineDisplacementCc,
      powerCv: vehicle.powerCv,
      drivetrain: vehicle.drivetrain,
      doors: vehicle.doors,
      seats: vehicle.seats,
      condition: vehicle.condition,
      features: vehicle.features,
      vatMode: 'inclusive',
      imageUrl: `/images/cars/${filename}`,
      images: [`/images/cars/${filename}`],
      description: 'SCHEDA DEMO: dati di esempio, non è un’offerta reale.',
      isDemo: true,
      sourceKey: vehicle.key,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  return prepared;
}

async function seedPicturesCars() {
  try {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Il seed con dati dimostrativi è bloccato in produzione.');
    }
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI non è configurato nel file .env della FREE.');
    }

    const records = await prepareVehicles();
    await mongoose.connect(process.env.MONGO_URI, { dbName: 'pelusogroup_free' });
    const collection = mongoose.connection.collection('vehicles');
    const operations = records.map((record) => ({
      updateOne: {
        filter: { sourceKey: record.sourceKey },
        update: { $set: record },
        upsert: true,
      },
    }));

    const result = await collection.bulkWrite(operations, { ordered: true });
    const removedDemo = await collection.deleteMany({
      isDemo: true,
      sourceKey: { $regex: '^pictures:', $nin: records.map((record) => record.sourceKey) },
    });
    console.log(`Schede demo aggiornate: ${result.upsertedCount + result.modifiedCount}; rimosse vecchie schede demo Pictures: ${removedDemo.deletedCount}.`);
    console.log(`Foto copiate da ${picturesRoot} a ${imageDirectory}.`);
  } catch (error) {
    console.error('Creazione schede dalle foto non riuscita:', error.message);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  }
}

seedPicturesCars();
