require('dotenv').config({ path: require('node:path').resolve(__dirname, '../../.env') });
require('../config/dns');

const fs = require('node:fs');
const fsPromises = require('node:fs/promises');
const path = require('node:path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

const proDirectory = path.resolve(__dirname, '../../../pelusogroup');
const proUploads = path.join(proDirectory, 'server', 'uploads', 'cars');
const freeImages = path.resolve(__dirname, '../../client/public/images/cars');
const legacyDemoIds = new Set([
  'chrysler-300c-touring',
  'alfa-romeo-giulietta',
  'mercedes-glc',
  'fiat-500',
  'bmw-serie-3',
  'mercedes-classe-a-rent',
]);
const allowedWarrantyCoverage = new Set([
  'engine', 'transmission', 'clutch', 'brakes', 'turbo', 'electrical', 'airConditioning', 'labor',
]);

function getProMongoUri() {
  const envPath = path.join(proDirectory, '.env');
  if (!fs.existsSync(envPath)) throw new Error('Non trovo il file .env della PRO nella cartella sorella pelusogroup.');
  const proEnv = dotenv.parse(fs.readFileSync(envPath));
  if (!proEnv.MONGO_URI) throw new Error('MONGO_URI non è configurato nel .env della PRO.');
  const database = decodeURIComponent(new URL(proEnv.MONGO_URI).pathname.slice(1));
  if (database !== 'pelusogroup') throw new Error('Il .env della PRO non punta al database pelusogroup.');
  return proEnv.MONGO_URI;
}

function safeConnectionError(error) {
  return String(error.message || error)
    .replace(/(mongodb(?:\+srv)?:\/\/)[^@\s]+@/gi, '$1[credentials]@');
}

async function findPhoto(vehicle, copiedFiles) {
  const candidates = [
    vehicle.image,
    ...(Array.isArray(vehicle.images) ? vehicle.images : []),
  ].filter((value, index, values) => typeof value === 'string' && values.indexOf(value) === index);

  for (const candidate of candidates) {
    const uploaded = /^\/uploads\/cars\/([a-f0-9]{32}\.(?:jpg|png|webp))$/i.exec(candidate);
    if (uploaded) {
      const filename = uploaded[1];
      const sourcePath = path.join(proUploads, filename);
      const targetName = `pro-${filename}`;
      const targetPath = path.join(freeImages, targetName);
      try {
        await fsPromises.access(sourcePath);
      } catch {
        continue;
      }
      await fsPromises.mkdir(freeImages, { recursive: true });
      try {
        await fsPromises.copyFile(sourcePath, targetPath, fs.constants.COPYFILE_EXCL);
        copiedFiles.push(targetPath);
      } catch (error) {
        if (error.code !== 'EEXIST') throw error;
      }
      return `/images/cars/${targetName}`;
    }

    try {
      const imageUrl = new URL(candidate);
      if (imageUrl.protocol === 'https:') return candidate;
    } catch {
      continue;
    }
  }
  return '';
}

function isRealSaleListing(vehicle) {
  const id = String(vehicle.id || '');
  const label = typeof vehicle.label === 'string' ? vehicle.label : '';
  return vehicle.type !== 'rent'
    && vehicle.demoData !== true
    && !legacyDemoIds.has(id)
    && !/\bdemo\b|dati fittizi/i.test(label);
}

function mapVehicle(vehicle, imageUrl, sourceKey) {
  const brand = typeof vehicle.make === 'string' ? vehicle.make.trim() : '';
  const model = typeof vehicle.model === 'string' ? vehicle.model.trim() : '';
  const optionalNumber = (value) => {
    if (value == null || value === '') return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  };
  const year = Number(vehicle.year);
  const listedPrice = Number(vehicle.price);
  const discountPrice = Number(vehicle.discountPrice);
  const discountEndTime = vehicle.discountEndsAt ? new Date(vehicle.discountEndsAt).getTime() : Infinity;
  const price = vehicle.type === 'buy'
    && Number.isFinite(discountPrice)
    && discountPrice > 0
    && discountPrice < listedPrice
    && discountEndTime > Date.now()
    ? discountPrice
    : listedPrice;
  const mileage = Number(vehicle.mileageKm);
  const installmentAmount = optionalNumber(vehicle.installmentPlan?.monthlyAmount);
  const installmentMonths = optionalNumber(vehicle.installmentPlan?.months);
  const installmentPlan = Number.isFinite(installmentAmount) && installmentAmount > 0
    && Number.isInteger(installmentMonths) && installmentMonths >= 2 && installmentMonths <= 120
    ? { monthlyAmount: installmentAmount, months: installmentMonths }
    : null;

  if (!brand || !model
    || !Number.isInteger(year)
    || !Number.isFinite(price) || price <= 0
    || !Number.isSafeInteger(mileage) || mileage < 0
    || !imageUrl) return null;

  return {
    brand,
    model,
    year,
    price,
    mileage,
    vatMode: ['inclusive', 'exclusive', 'not-applied'].includes(vehicle.vatMode) ? vehicle.vatMode : 'inclusive',
    fuel: typeof vehicle.fuel === 'string' ? vehicle.fuel.trim() : '',
    bodyType: typeof vehicle.bodyType === 'string' ? vehicle.bodyType.trim() : '',
    transmission: typeof vehicle.transmission === 'string' ? vehicle.transmission.trim() : '',
    engine: typeof vehicle.engine === 'string' ? vehicle.engine.trim() : '',
    engineDisplacementCc: optionalNumber(vehicle.engineDisplacementCc),
    cylinders: optionalNumber(vehicle.cylinders),
    power: typeof vehicle.power === 'string' ? vehicle.power.trim() : '',
    powerCv: optionalNumber(vehicle.powerCv),
    powerKw: optionalNumber(vehicle.powerKw),
    color: typeof vehicle.color === 'string' ? vehicle.color.trim() : '',
    drivetrain: typeof vehicle.drivetrain === 'string' ? vehicle.drivetrain.trim() : '',
    doors: optionalNumber(vehicle.doors),
    seats: optionalNumber(vehicle.seats),
    condition: typeof vehicle.condition === 'string' ? vehicle.condition.trim() : '',
    previousOwners: optionalNumber(vehicle.previousOwners),
    warrantyMonths: optionalNumber(vehicle.warrantyMonths),
    maintenanceHistory: typeof vehicle.maintenanceHistory === 'string' ? vehicle.maintenanceHistory.trim() : '',
    emissionsClass: typeof vehicle.emissionsClass === 'string' ? vehicle.emissionsClass.trim() : '',
    consumptionCombined: optionalNumber(vehicle.consumptionCombined),
    consumptionUnit: vehicle.consumptionUnit === 'kWh/100 km' ? 'kWh/100 km' : 'l/100 km',
    co2Emissions: optionalNumber(vehicle.co2Emissions),
    torqueNm: optionalNumber(vehicle.torqueNm),
    accelerationSeconds: optionalNumber(vehicle.accelerationSeconds),
    topSpeedKmh: optionalNumber(vehicle.topSpeedKmh),
    trunkCapacityLitres: optionalNumber(vehicle.trunkCapacityLitres),
    firstRegistration: typeof vehicle.firstRegistration === 'string' ? vehicle.firstRegistration.trim() : '',
    inspectionYear: optionalNumber(vehicle.inspectionYear),
    lastService: typeof vehicle.lastService === 'string' ? vehicle.lastService.trim() : '',
    noviceDriverEligible: ['yes', 'no', 'unknown'].includes(vehicle.noviceDriverEligible)
      ? vehicle.noviceDriverEligible
      : 'unknown',
    features: Array.isArray(vehicle.features)
      ? vehicle.features.filter((feature) => typeof feature === 'string').map((feature) => feature.trim()).filter(Boolean)
      : [],
    warrantyCoverage: Array.isArray(vehicle.warrantyCoverage)
      ? [...new Set(vehicle.warrantyCoverage.filter((item) => typeof item === 'string' && allowedWarrantyCoverage.has(item)))]
      : [],
    label: typeof vehicle.label === 'string' ? vehicle.label.trim() : '',
    installmentPlan,
    images: [imageUrl],
    imageUrl,
    description: typeof vehicle.description === 'string' ? vehicle.description.trim() : '',
    isDemo: false,
    sourceKey: `pro:${sourceKey}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

async function importProVehicles() {
  let proConnection;
  let freeConnection;
  const copiedFiles = [];

  try {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Esegui l’importazione da un ambiente locale, non in produzione.');
    }
    if (!process.env.MONGO_URI) throw new Error('MONGO_URI non è configurato nel .env della FREE.');

    const proUri = getProMongoUri();
    proConnection = mongoose.createConnection(proUri, { dbName: 'pelusogroup' });
    freeConnection = mongoose.createConnection(process.env.MONGO_URI, { dbName: 'pelusogroup_free' });
    await Promise.all([proConnection.asPromise(), freeConnection.asPromise()]);

    const proVehicles = await proConnection.collection('vehicles')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    const sourceVehicles = proVehicles.filter(isRealSaleListing);
    const prepared = [];
    let missingPhoto = 0;
    let invalidData = 0;

    for (const vehicle of sourceVehicles) {
      const sourceKey = String(vehicle.id || vehicle._id);
      const imageUrl = await findPhoto(vehicle, copiedFiles);
      const mapped = mapVehicle(vehicle, imageUrl, sourceKey);
      if (mapped) {
        prepared.push(mapped);
      } else if (!imageUrl) {
        missingPhoto += 1;
      } else {
        invalidData += 1;
      }
    }

    if (prepared.length === 0) {
      const excludedRentals = proVehicles.filter((vehicle) => vehicle.type === 'rent').length;
      const excludedDemoOrLegacy = proVehicles.filter((vehicle) => (
        vehicle.type !== 'rent' && !isRealSaleListing(vehicle)
      )).length;
      throw new Error(
        `Nessun annuncio importabile. Record PRO: ${proVehicles.length}; esclusi noleggi: ${excludedRentals}; esclusi demo/legacy: ${excludedDemoOrLegacy}; vendite restanti: ${sourceVehicles.length}; senza foto utilizzabile: ${missingPhoto}; dati mancanti/non validi: ${invalidData}. Nessun dato FREE è stato modificato.`,
      );
    }

    const freeVehicles = freeConnection.collection('vehicles');
    const importedKeys = prepared.map((vehicle) => vehicle.sourceKey);
    const existing = await freeVehicles.find({ sourceKey: { $in: importedKeys } })
      .project({ sourceKey: 1 })
      .toArray();
    const existingKeys = new Set(existing.map((vehicle) => vehicle.sourceKey));
    const newVehicles = prepared.filter((vehicle) => !existingKeys.has(vehicle.sourceKey));

    if (newVehicles.length > 0) await freeVehicles.insertMany(newVehicles);
    const removedDemo = await freeVehicles.deleteMany({ isDemo: true });
    console.log(`Importati ${newVehicles.length} annunci reali dalla PRO; rimossi ${removedDemo.deletedCount} annunci dimostrativi.`);
    console.log('Gli annunci importati sono una copia indipendente; le foto locali sono state copiate in FREE.');
  } catch (error) {
    console.error('Importazione PRO non riuscita:', safeConnectionError(error));
    process.exitCode = 1;
  } finally {
    if (proConnection && proConnection.readyState !== 0) await proConnection.close();
    if (freeConnection && freeConnection.readyState !== 0) await freeConnection.close();
  }
}

importProVehicles();
