require('dotenv').config();
require('./config/dns');

const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const app = express();
const port = Number(process.env.PORT) || 5001;
const cookieName = 'pgfree_admin';
const sessionDurationMs = 8 * 60 * 60 * 1000;
const attempts = new Map();
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5174';
const uploadedImagesDirectory = path.join(__dirname, 'uploads', 'cars');
const uploadedSiteLogoDirectory = path.join(__dirname, 'uploads', 'branding');
const defaultSiteSettings = {
  vatRate: 22,
  email: 'info@example.com',
  phone: '+39 000 000 0000',
  whatsapp: '+39 000 000 0000',
  logoUrl: '/logo.png',
  publicAdmins: ['Luigi Peluso', 'Gerardo Peluso'],
  contactsAreReal: false,
  socialLinks: {
    facebook: '',
    instagram: '',
    tiktok: '',
    youtube: '',
  },
};
const imageContentTypes = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};
const warrantyCoverageValues = new Set([
  'engine', 'transmission', 'clutch', 'brakes', 'turbo', 'electrical', 'airConditioning', 'labor',
]);
const installmentPlanSchema = new mongoose.Schema({
  monthlyAmount: { type: Number, min: 0.01, max: 100000000 },
  months: { type: Number, min: 2, max: 120 },
  terms: { type: String, trim: true, maxlength: 1000, default: '' },
}, { _id: false });

const vehicleSchema = new mongoose.Schema({
  brand: { type: String, required: true, trim: true, maxlength: 50 },
  model: { type: String, required: true, trim: true, maxlength: 80 },
  year: { type: Number, required: true, min: 1886 },
  price: { type: Number, required: true, min: 0 },
  listingType: { type: String, enum: ['sale', 'rental'], default: 'sale' },
  rentalAvailable: { type: Boolean, default: true },
  rentalTerms: { type: String, trim: true, maxlength: 1000, default: '' },
  mileage: { type: Number, required: true, min: 0 },
  vatMode: { type: String, enum: ['inclusive', 'exclusive', 'not-applied'], default: 'inclusive' },
  fuel: { type: String, trim: true, maxlength: 30, default: '' },
  bodyType: { type: String, trim: true, maxlength: 40, default: '' },
  transmission: { type: String, trim: true, maxlength: 40, default: '' },
  engine: { type: String, trim: true, maxlength: 100, default: '' },
  engineDisplacementCc: { type: Number, min: 500, max: 20000, default: null },
  cylinders: { type: Number, min: 1, max: 16, default: null },
  power: { type: String, trim: true, maxlength: 50, default: '' },
  powerCv: { type: Number, min: 1, max: 3000, default: null },
  powerKw: { type: Number, min: 0.1, max: 2000, default: null },
  color: { type: String, trim: true, maxlength: 40, default: '' },
  drivetrain: { type: String, trim: true, maxlength: 60, default: '' },
  doors: { type: Number, min: 1, max: 8, default: null },
  seats: { type: Number, min: 1, max: 20, default: null },
  condition: { type: String, trim: true, maxlength: 40, default: '' },
  previousOwners: { type: Number, min: 0, max: 50, default: null },
  warrantyMonths: { type: Number, min: 0, max: 120, default: null },
  maintenanceHistory: { type: String, trim: true, maxlength: 1000, default: '' },
  emissionsClass: { type: String, trim: true, maxlength: 20, default: '' },
  consumptionCombined: { type: Number, min: 0.1, max: 100, default: null },
  consumptionUnit: { type: String, enum: ['l/100 km', 'kWh/100 km'], default: 'l/100 km' },
  co2Emissions: { type: Number, min: 0, max: 2000, default: null },
  torqueNm: { type: Number, min: 1, max: 10000, default: null },
  accelerationSeconds: { type: Number, min: 0.1, max: 120, default: null },
  topSpeedKmh: { type: Number, min: 1, max: 600, default: null },
  trunkCapacityLitres: { type: Number, min: 0, max: 10000, default: null },
  firstRegistration: { type: String, trim: true, maxlength: 20, default: '' },
  inspectionYear: { type: Number, min: 1950, default: null },
  lastService: { type: String, trim: true, maxlength: 80, default: '' },
  noviceDriverEligible: { type: String, enum: ['yes', 'no', 'unknown'], default: 'unknown' },
  features: { type: [{ type: String, trim: true, maxlength: 80 }], default: [] },
  warrantyCoverage: { type: [{ type: String, enum: [...warrantyCoverageValues] }], default: [] },
  label: { type: String, trim: true, maxlength: 50, default: '' },
  installmentPlan: { type: installmentPlanSchema, default: null },
  additionalCosts: { type: String, trim: true, maxlength: 500, default: '' },
  images: { type: [{ type: String, trim: true, maxlength: 500 }], default: [] },
  imageUrl: { type: String, trim: true, maxlength: 500, default: '' },
  description: { type: String, trim: true, maxlength: 1000, default: '' },
  isDemo: { type: Boolean, default: false },
  sourceKey: { type: String, trim: true, default: '' },
}, { timestamps: true, collection: 'vehicles' });

const inquirySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
  phone: { type: String, trim: true, maxlength: 40, default: '' },
  message: { type: String, required: true, trim: true, maxlength: 2000 },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, default: null },
  vehicleLabel: { type: String, trim: true, maxlength: 140, default: '' },
  inquiryType: { type: String, enum: ['contact', 'rental'], default: 'contact' },
  rentalStart: { type: String, default: '' },
  rentalEnd: { type: String, default: '' },
  status: { type: String, enum: ['open', 'handled'], default: 'open' },
}, { timestamps: true, collection: 'contact_inquiries' });

const siteSettingsSchema = new mongoose.Schema({
  key: { type: String, unique: true, default: 'public' },
  vatRate: { type: Number, min: 0, max: 100, default: defaultSiteSettings.vatRate },
  email: { type: String, trim: true, lowercase: true, maxlength: 254, default: defaultSiteSettings.email },
  phone: { type: String, trim: true, maxlength: 40, default: defaultSiteSettings.phone },
  whatsapp: { type: String, trim: true, maxlength: 40, default: defaultSiteSettings.whatsapp },
  logoUrl: { type: String, trim: true, maxlength: 500, default: defaultSiteSettings.logoUrl },
  publicAdmins: { type: [{ type: String, trim: true, maxlength: 80 }], default: defaultSiteSettings.publicAdmins },
  contactsAreReal: { type: Boolean, default: false },
  socialLinks: {
    facebook: { type: String, trim: true, maxlength: 500, default: '' },
    instagram: { type: String, trim: true, maxlength: 500, default: '' },
    tiktok: { type: String, trim: true, maxlength: 500, default: '' },
    youtube: { type: String, trim: true, maxlength: 500, default: '' },
  },
}, { timestamps: true, collection: 'site_settings' });

const Vehicle = mongoose.model('FreeVehicle', vehicleSchema);
const Inquiry = mongoose.model('FreeInquiry', inquirySchema);
const SiteSettings = mongoose.model('FreeSiteSettings', siteSettingsSchema);

app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; img-src 'self' https: data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'");
  next();
});
app.use(cors({ origin: clientOrigin, credentials: true }));
app.use(express.json({ limit: '20kb' }));

function isRateLimited(key, maxAttempts, windowMs) {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || now - current.firstAt >= windowMs) {
    attempts.set(key, { firstAt: now, count: 1 });
    if (attempts.size > 2000) {
      for (const [attemptKey, value] of attempts) {
        if (now - value.firstAt >= windowMs) attempts.delete(attemptKey);
      }
    }
    return false;
  }
  if (current.count >= maxAttempts) return true;
  current.count += 1;
  return false;
}

function sessionSignature(payload) {
  return crypto.createHmac('sha256', process.env.SESSION_SECRET).update(payload).digest('hex');
}

function createSessionToken() {
  const payload = Buffer.from(String(Date.now() + sessionDurationMs)).toString('base64url');
  return `${payload}.${sessionSignature(payload)}`;
}

function hasAdminSession(req) {
  const cookieHeader = req.headers.cookie || '';
  const token = cookieHeader.split(';').map((item) => item.trim())
    .find((item) => item.startsWith(`${cookieName}=`))
    ?.slice(cookieName.length + 1);
  if (!token) return false;

  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra || !/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = sessionSignature(payload);
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false;

  try {
    const expiresAt = Number(Buffer.from(payload, 'base64url').toString());
    return Number.isSafeInteger(expiresAt) && expiresAt > Date.now();
  } catch {
    return false;
  }
}

function adminOnly(req, res, next) {
  res.setHeader('Cache-Control', 'no-store');
  if (!hasAdminSession(req)) return res.status(401).json({ error: 'Accedi per continuare.' });
  return next();
}

function validateVehicle(body) {
  const data = body && typeof body === 'object' ? body : {};
  const optionalNumber = (value) => value === '' || value == null ? null : Number(value);
  const rawInstallmentPlan = data.installmentPlan && typeof data.installmentPlan === 'object'
    ? data.installmentPlan
    : {};
  const installmentAmount = optionalNumber(rawInstallmentPlan.monthlyAmount);
  const installmentMonths = optionalNumber(rawInstallmentPlan.months);
  const hasInstallmentPlan = installmentAmount !== null || installmentMonths !== null;
  const rawImages = data.images == null ? [data.imageUrl] : data.images;
  const imageList = Array.isArray(rawImages)
    ? [...new Set(rawImages.filter((image) => typeof image === 'string').map((image) => image.trim()).filter(Boolean))]
    : [];
  const vehicle = {
    brand: typeof data.brand === 'string' ? data.brand.trim() : '',
    model: typeof data.model === 'string' ? data.model.trim() : '',
    year: Number(data.year),
    price: Number(data.price),
    listingType: data.listingType == null ? 'sale' : data.listingType,
    rentalAvailable: data.rentalAvailable == null ? true : data.rentalAvailable,
    rentalTerms: typeof data.rentalTerms === 'string' ? data.rentalTerms.trim() : '',
    mileage: Number(data.mileage),
    vatMode: ['inclusive', 'exclusive', 'not-applied'].includes(data.vatMode) ? data.vatMode : 'inclusive',
    fuel: typeof data.fuel === 'string' ? data.fuel.trim() : '',
    bodyType: typeof data.bodyType === 'string' ? data.bodyType.trim() : '',
    transmission: typeof data.transmission === 'string' ? data.transmission.trim() : '',
    engine: typeof data.engine === 'string' ? data.engine.trim() : '',
    engineDisplacementCc: optionalNumber(data.engineDisplacementCc),
    cylinders: optionalNumber(data.cylinders),
    power: typeof data.power === 'string' ? data.power.trim() : '',
    powerCv: optionalNumber(data.powerCv),
    powerKw: optionalNumber(data.powerKw),
    color: typeof data.color === 'string' ? data.color.trim() : '',
    drivetrain: typeof data.drivetrain === 'string' ? data.drivetrain.trim() : '',
    doors: optionalNumber(data.doors),
    seats: optionalNumber(data.seats),
    condition: typeof data.condition === 'string' ? data.condition.trim() : '',
    previousOwners: optionalNumber(data.previousOwners),
    warrantyMonths: optionalNumber(data.warrantyMonths),
    maintenanceHistory: typeof data.maintenanceHistory === 'string' ? data.maintenanceHistory.trim() : '',
    emissionsClass: typeof data.emissionsClass === 'string' ? data.emissionsClass.trim() : '',
    consumptionCombined: optionalNumber(data.consumptionCombined),
    consumptionUnit: ['l/100 km', 'kWh/100 km'].includes(data.consumptionUnit) ? data.consumptionUnit : 'l/100 km',
    co2Emissions: optionalNumber(data.co2Emissions),
    torqueNm: optionalNumber(data.torqueNm),
    accelerationSeconds: optionalNumber(data.accelerationSeconds),
    topSpeedKmh: optionalNumber(data.topSpeedKmh),
    trunkCapacityLitres: optionalNumber(data.trunkCapacityLitres),
    firstRegistration: typeof data.firstRegistration === 'string' ? data.firstRegistration.trim() : '',
    inspectionYear: optionalNumber(data.inspectionYear),
    lastService: typeof data.lastService === 'string' ? data.lastService.trim() : '',
    noviceDriverEligible: ['yes', 'no', 'unknown'].includes(data.noviceDriverEligible) ? data.noviceDriverEligible : 'unknown',
    features: Array.isArray(data.features) ? data.features.map((feature) => (
      typeof feature === 'string' ? feature.trim() : ''
    )) : [],
    warrantyCoverage: Array.isArray(data.warrantyCoverage)
      ? [...new Set(data.warrantyCoverage.filter((item) => typeof item === 'string'))]
      : [],
    label: typeof data.label === 'string' ? data.label.trim() : '',
    installmentPlan: hasInstallmentPlan
      ? { monthlyAmount: Math.round(installmentAmount * 100) / 100, months: installmentMonths, terms: typeof rawInstallmentPlan.terms === 'string' ? rawInstallmentPlan.terms.trim() : '' }
      : null,
    additionalCosts: typeof data.additionalCosts === 'string' ? data.additionalCosts.trim() : '',
    images: imageList,
    imageUrl: imageList[0] || '',
    description: typeof data.description === 'string' ? data.description.trim() : '',
    isDemo: data.isDemo === true,
  };
  const currentYear = new Date().getFullYear();

  if (!['sale', 'rental'].includes(vehicle.listingType)
    || typeof vehicle.rentalAvailable !== 'boolean'
    || (data.rentalTerms != null && typeof data.rentalTerms !== 'string')
    || vehicle.rentalTerms.length > 1000) {
    return { error: 'Controlla il tipo di annuncio e le condizioni del noleggio.' };
  }
  if (vehicle.listingType === 'rental' && (data.price === '' || data.price == null || !Number.isFinite(vehicle.price) || vehicle.price <= 0 || vehicle.price > 100000000)) {
    return { error: 'Inserisci una tariffa giornaliera valida maggiore di zero.' };
  }
  if (vehicle.brand.length < 1 || vehicle.brand.length > 50
    || vehicle.model.length < 1 || vehicle.model.length > 80) {
    return { error: 'Inserisci marca e modello (massimo 50 e 80 caratteri).' };
  }
  if (!Number.isInteger(vehicle.year) || vehicle.year < 1886 || vehicle.year > currentYear + 1) {
    return { error: 'Inserisci un anno valido.' };
  }
  if (!Number.isFinite(vehicle.price) || vehicle.price < 0
    || !Number.isSafeInteger(vehicle.mileage) || vehicle.mileage < 0) {
    return { error: 'Prezzo o chilometraggio non validi.' };
  }
  if (vehicle.fuel.length > 30 || vehicle.bodyType.length > 40 || vehicle.transmission.length > 40
    || vehicle.engine.length > 100 || vehicle.power.length > 50 || vehicle.color.length > 40 || vehicle.drivetrain.length > 60
    || vehicle.condition.length > 40 || vehicle.maintenanceHistory.length > 1000
    || vehicle.emissionsClass.length > 20 || vehicle.firstRegistration.length > 20
    || vehicle.lastService.length > 80 || vehicle.label.length > 50 || vehicle.description.length > 1000
    || vehicle.additionalCosts.length > 500 || (vehicle.installmentPlan && vehicle.installmentPlan.terms.length > 1000)) {
    return { error: 'Controlla la lunghezza dei dettagli e della descrizione.' };
  }
  const invalidTechnicalNumbers = (
    vehicle.engineDisplacementCc !== null
      && (!Number.isInteger(vehicle.engineDisplacementCc) || vehicle.engineDisplacementCc < 500 || vehicle.engineDisplacementCc > 20000)
  ) || (
    vehicle.cylinders !== null && (!Number.isInteger(vehicle.cylinders) || vehicle.cylinders < 1 || vehicle.cylinders > 16)
  ) || (
    vehicle.powerCv !== null && (!Number.isInteger(vehicle.powerCv) || vehicle.powerCv < 1 || vehicle.powerCv > 3000)
  ) || (
    vehicle.powerKw !== null && (!Number.isFinite(vehicle.powerKw) || vehicle.powerKw < 0.1 || vehicle.powerKw > 2000)
  ) || (
    vehicle.doors !== null && (!Number.isInteger(vehicle.doors) || vehicle.doors < 1 || vehicle.doors > 8)
  ) || (
    vehicle.seats !== null && (!Number.isInteger(vehicle.seats) || vehicle.seats < 1 || vehicle.seats > 20)
  ) || (
    vehicle.previousOwners !== null && (!Number.isInteger(vehicle.previousOwners) || vehicle.previousOwners < 0 || vehicle.previousOwners > 50)
  ) || (
    vehicle.warrantyMonths !== null && (!Number.isInteger(vehicle.warrantyMonths) || vehicle.warrantyMonths < 0 || vehicle.warrantyMonths > 120)
  ) || (
    vehicle.consumptionCombined !== null && (!Number.isFinite(vehicle.consumptionCombined) || vehicle.consumptionCombined <= 0 || vehicle.consumptionCombined > 100)
  ) || (
    vehicle.co2Emissions !== null && (!Number.isFinite(vehicle.co2Emissions) || vehicle.co2Emissions < 0 || vehicle.co2Emissions > 2000)
  ) || (
    vehicle.torqueNm !== null && (!Number.isInteger(vehicle.torqueNm) || vehicle.torqueNm < 1 || vehicle.torqueNm > 10000)
  ) || (
    vehicle.accelerationSeconds !== null && (!Number.isFinite(vehicle.accelerationSeconds) || vehicle.accelerationSeconds <= 0 || vehicle.accelerationSeconds > 120)
  ) || (
    vehicle.topSpeedKmh !== null && (!Number.isInteger(vehicle.topSpeedKmh) || vehicle.topSpeedKmh < 1 || vehicle.topSpeedKmh > 600)
  ) || (
    vehicle.trunkCapacityLitres !== null && (!Number.isInteger(vehicle.trunkCapacityLitres) || vehicle.trunkCapacityLitres < 0 || vehicle.trunkCapacityLitres > 10000)
  ) || (
    vehicle.inspectionYear !== null && (!Number.isInteger(vehicle.inspectionYear) || vehicle.inspectionYear < 1950 || vehicle.inspectionYear > new Date().getFullYear() + 10)
  ) || (
    hasInstallmentPlan
      && (!Number.isFinite(installmentAmount) || installmentAmount < 0.01 || installmentAmount > 100000000
        || !Number.isInteger(installmentMonths) || installmentMonths < 2 || installmentMonths > 120)
  );
  if (invalidTechnicalNumbers) {
    return { error: 'Controlla i valori inseriti nei dettagli tecnici e commerciali dell’auto.' };
  }
  if (data.installmentPlan != null && (typeof data.installmentPlan !== 'object' || Array.isArray(data.installmentPlan))) {
    return { error: 'Inserisci un piano rateale valido.' };
  }
  if ((data.additionalCosts != null && typeof data.additionalCosts !== 'string')
    || (rawInstallmentPlan.terms != null && typeof rawInstallmentPlan.terms !== 'string')
    || (!hasInstallmentPlan && typeof rawInstallmentPlan.terms === 'string' && rawInstallmentPlan.terms.trim())) {
    return { error: 'Controlla i costi aggiuntivi e le condizioni del piano rateale.' };
  }
  if (data.noviceDriverEligible != null && !['yes', 'no', 'unknown'].includes(data.noviceDriverEligible)) {
    return { error: 'Seleziona un’opzione valida per i neopatentati.' };
  }
  if (data.warrantyCoverage != null && (!Array.isArray(data.warrantyCoverage)
    || data.warrantyCoverage.length > warrantyCoverageValues.size
    || data.warrantyCoverage.some((item) => typeof item !== 'string' || !warrantyCoverageValues.has(item)))) {
    return { error: 'Seleziona componenti coperti da garanzia validi.' };
  }
  if (data.features != null && (!Array.isArray(data.features) || data.features.length > 20
    || data.features.some((feature) => typeof feature !== 'string' || feature.trim().length > 80))) {
    return { error: 'Inserisci al massimo 20 dotazioni, ciascuna entro 80 caratteri.' };
  }
  if (data.images != null && (!Array.isArray(data.images) || data.images.length > 8
    || data.images.some((image) => typeof image !== 'string'))) {
    return { error: 'Inserisci al massimo 8 URL foto validi.' };
  }
  if (data.imageUrl != null && typeof data.imageUrl !== 'string') {
    return { error: 'Inserisci un URL foto valido.' };
  }
  if (data.consumptionUnit != null && !['l/100 km', 'kWh/100 km'].includes(data.consumptionUnit)) {
    return { error: 'Seleziona un’unità di consumo valida.' };
  }
  for (const imageUrl of vehicle.images) {
    if (imageUrl.length > 500) return { error: 'Ogni URL foto può contenere al massimo 500 caratteri.' };
    if (imageUrl.startsWith('/')) {
      const importedImage = /^\/images\/cars\/(?:pro|pictures)-[a-f0-9]{32}\.(?:jpg|png|webp)$/i.test(imageUrl);
      const uploadedImage = /^\/api\/vehicle-images\/[a-f0-9]{32}\.(?:jpg|png|webp)$/i.test(imageUrl);
      if (!importedImage && !uploadedImage) {
        return { error: 'Il percorso della foto locale non è valido.' };
      }
    } else {
      try {
        const image = new URL(imageUrl);
        if (image.protocol !== 'https:') return { error: 'Le foto devono usare URL HTTPS.' };
      } catch {
        return { error: 'Inserisci URL HTTPS validi per le foto.' };
      }
    }
  }
  return { vehicle };
}

function validateSiteSettings(body) {
  const data = body && typeof body === 'object' ? body : {};
  const vatRate = Number(data.vatRate);
  const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
  const phone = typeof data.phone === 'string' ? data.phone.trim() : '';
  const whatsapp = typeof data.whatsapp === 'string' ? data.whatsapp.trim() : '';
  const logoUrl = typeof data.logoUrl === 'string' && data.logoUrl.trim()
    ? data.logoUrl.trim()
    : defaultSiteSettings.logoUrl;
  const publicAdmins = Array.isArray(data.publicAdmins)
    ? data.publicAdmins.map((name) => typeof name === 'string' ? name.trim() : '')
    : [];
  const socialInput = data.socialLinks && typeof data.socialLinks === 'object' ? data.socialLinks : {};
  const socialLinks = Object.fromEntries(Object.keys(defaultSiteSettings.socialLinks).map((key) => [
    key,
    typeof socialInput[key] === 'string' ? socialInput[key].trim() : '',
  ]));
  const localLogo = logoUrl === '/logo.png'
    || /^\/api\/site-assets\/logo\/[a-f0-9]{32}\.(?:jpg|png|webp)$/i.test(logoUrl);
  let validLogoUrl = localLogo;
  if (!validLogoUrl) {
    try {
      const parsedLogoUrl = new URL(logoUrl);
      validLogoUrl = parsedLogoUrl.protocol === 'https:' && !parsedLogoUrl.username && !parsedLogoUrl.password;
    } catch {
      validLogoUrl = false;
    }
  }

  if (data.vatRate == null || data.vatRate === '' || !Number.isFinite(vatRate) || vatRate < 0 || vatRate > 100) {
    return { error: 'L’aliquota IVA deve essere compresa tra 0 e 100.' };
  }
  if (email.length > 254 || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    return { error: 'Inserisci un indirizzo email valido.' };
  }
  const validPhone = /^[0-9+\s().-]*$/;
  if (phone.length > 40 || whatsapp.length > 40 || !validPhone.test(phone) || !validPhone.test(whatsapp)) {
    return { error: 'Telefono e WhatsApp possono contenere solo numeri e caratteri telefonici.' };
  }
  if (logoUrl.length > 500 || !validLogoUrl) {
    return { error: 'Seleziona un logo caricato oppure inserisci un URL HTTPS.' };
  }
  if (!Array.isArray(data.publicAdmins) || publicAdmins.length > 10
    || publicAdmins.some((name) => name.length < 2 || name.length > 80)
    || new Set(publicAdmins.map((name) => name.toLocaleLowerCase('it-IT'))).size !== publicAdmins.length) {
    return { error: 'Inserisci al massimo 10 nomi pubblici distinti, da 2 a 80 caratteri ciascuno.' };
  }
  if (typeof data.contactsAreReal !== 'boolean') {
    return { error: 'Conferma se i recapiti inseriti sono reali o provvisori.' };
  }
  for (const [network, value] of Object.entries(socialLinks)) {
    if (!value) continue;
    if (value.length > 500) return { error: `Il link ${network} è troppo lungo.` };
    try {
      const url = new URL(value);
      if (url.protocol !== 'https:' || url.username || url.password) {
        return { error: `Inserisci un link HTTPS valido per ${network}.` };
      }
    } catch {
      return { error: `Inserisci un link HTTPS valido per ${network}.` };
    }
  }

  return {
    settings: {
      ...defaultSiteSettings,
      vatRate,
      email,
      phone,
      whatsapp,
      logoUrl,
      publicAdmins,
      contactsAreReal: data.contactsAreReal,
      socialLinks,
    },
  };
}

function publicSiteSettings(settings) {
  if (!settings) return { ...defaultSiteSettings };
  return {
    vatRate: settings.vatRate ?? defaultSiteSettings.vatRate,
    email: settings.email ?? defaultSiteSettings.email,
    phone: settings.phone ?? defaultSiteSettings.phone,
    whatsapp: settings.whatsapp ?? defaultSiteSettings.whatsapp,
    logoUrl: settings.logoUrl || defaultSiteSettings.logoUrl,
    publicAdmins: Array.isArray(settings.publicAdmins) ? settings.publicAdmins : [...defaultSiteSettings.publicAdmins],
    contactsAreReal: settings.contactsAreReal === true,
    socialLinks: Object.fromEntries(Object.keys(defaultSiteSettings.socialLinks).map((key) => [
      key,
      settings.socialLinks?.[key] || '',
    ])),
  };
}

function route(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function detectImageType(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { extension: 'jpg', contentType: 'image/jpeg' };
  }
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    return { extension: 'png', contentType: 'image/png' };
  }
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF'
    && buffer.toString('ascii', 8, 12) === 'WEBP') {
    return { extension: 'webp', contentType: 'image/webp' };
  }
  return null;
}

app.post('/api/admin/vehicle-images', adminOnly, express.raw({
  type: Object.values(imageContentTypes),
  limit: '8mb',
}), route(async (req, res) => {
  if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
    return res.status(415).json({ error: 'Carica un’immagine JPEG, PNG o WebP valida.' });
  }
  const imageType = detectImageType(req.body);
  const claimedType = String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
  if (!imageType || imageType.contentType !== claimedType) {
    return res.status(415).json({ error: 'Il file non corrisponde a un’immagine JPEG, PNG o WebP valida.' });
  }

  const filename = `${crypto.randomBytes(16).toString('hex')}.${imageType.extension}`;
  await fs.mkdir(uploadedImagesDirectory, { recursive: true });
  await fs.writeFile(path.join(uploadedImagesDirectory, filename), req.body, { flag: 'wx' });
  return res.status(201).json({ imageUrl: `/api/vehicle-images/${filename}` });
}));

app.get('/api/vehicle-images/:filename', route(async (req, res) => {
  const filename = req.params.filename;
  const match = /^([a-f0-9]{32})\.(jpg|png|webp)$/i.exec(filename);
  if (!match) return res.status(404).json({ error: 'Foto non trovata.' });

  try {
    const image = await fs.readFile(path.join(uploadedImagesDirectory, filename));
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Content-Type', imageContentTypes[match[2].toLowerCase()]);
    return res.send(image);
  } catch (error) {
    if (error.code === 'ENOENT') return res.status(404).json({ error: 'Foto non trovata.' });
    throw error;
  }
}));

app.post('/api/admin/site-logo', adminOnly, express.raw({
  type: Object.values(imageContentTypes),
  limit: '5mb',
}), route(async (req, res) => {
  if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
    return res.status(415).json({ error: 'Carica un’immagine JPEG, PNG o WebP valida.' });
  }
  const imageType = detectImageType(req.body);
  const claimedType = String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
  if (!imageType || imageType.contentType !== claimedType) {
    return res.status(415).json({ error: 'Il file non corrisponde a un’immagine JPEG, PNG o WebP valida.' });
  }

  const filename = `${crypto.randomBytes(16).toString('hex')}.${imageType.extension}`;
  await fs.mkdir(uploadedSiteLogoDirectory, { recursive: true });
  await fs.writeFile(path.join(uploadedSiteLogoDirectory, filename), req.body, { flag: 'wx' });
  return res.status(201).json({ logoUrl: `/api/site-assets/logo/${filename}` });
}));

app.get('/api/site-assets/logo/:filename', route(async (req, res) => {
  const filename = req.params.filename;
  const match = /^([a-f0-9]{32})\.(jpg|png|webp)$/i.exec(filename);
  if (!match) return res.status(404).json({ error: 'Logo non trovato.' });

  try {
    const image = await fs.readFile(path.join(uploadedSiteLogoDirectory, filename));
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Content-Type', imageContentTypes[match[2].toLowerCase()]);
    return res.send(image);
  } catch (error) {
    if (error.code === 'ENOENT') return res.status(404).json({ error: 'Logo non trovato.' });
    throw error;
  }
}));

app.get('/api/site-settings', route(async (req, res) => {
  const settings = await SiteSettings.findOne({ key: 'public' }).lean();
  return res.json({ settings: publicSiteSettings(settings) });
}));

app.put('/api/admin/site-settings', adminOnly, route(async (req, res) => {
  const { settings, error } = validateSiteSettings(req.body);
  if (error) return res.status(400).json({ error });
  const saved = await SiteSettings.findOneAndUpdate(
    { key: 'public' },
    { $set: settings },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
  ).lean();
  return res.json({ settings: publicSiteSettings(saved) });
}));

app.get('/api/vehicles', route(async (req, res) => {
  const vehicles = await Vehicle.find().sort({ createdAt: -1 }).lean();
  res.json({ vehicles, rentalSupported: true });
}));

app.post('/api/contact', route(async (req, res) => {
  if (isRateLimited(`contact:${req.ip}`, 5, 15 * 60 * 1000)) {
    return res.status(429).json({ error: 'Hai inviato troppi messaggi. Riprova più tardi.' });
  }
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (name.length < 2 || name.length > 80) {
    return res.status(400).json({ error: 'Il nome deve contenere da 2 a 80 caratteri.' });
  }
  if (!validEmail || email.length > 254) {
    return res.status(400).json({ error: 'Inserisci un indirizzo email valido.' });
  }
  if (phone.length > 40 || message.length < 10 || message.length > 2000) {
    return res.status(400).json({ error: 'Controlla telefono e messaggio (da 10 a 2000 caratteri).' });
  }

  let vehicleId = null;
  let vehicleLabel = '';
  let inquiryType = 'contact';
  let rentalStart = '';
  let rentalEnd = '';
  if (body.vehicleId != null && body.vehicleId !== '') {
    if (typeof body.vehicleId !== 'string' || !mongoose.isValidObjectId(body.vehicleId)) {
      return res.status(400).json({ error: 'Annuncio non valido. Rimuovi il riferimento e riprova.' });
    }
    const vehicle = await Vehicle.findById(body.vehicleId).select('brand model year isDemo listingType rentalAvailable').lean();
    if (!vehicle || vehicle.isDemo) {
      return res.status(400).json({ error: 'L’annuncio non è disponibile. Rimuovi il riferimento e riprova.' });
    }
    vehicleId = vehicle._id;
    vehicleLabel = `${vehicle.brand} ${vehicle.model} (${vehicle.year})`;
    if (vehicle.listingType === 'rental') {
      if (vehicle.rentalAvailable === false) {
        return res.status(400).json({ error: 'Le richieste per questo noleggio sono temporaneamente sospese.' });
      }
      const validDate = (value) => {
        if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
        const date = new Date(`${value}T00:00:00Z`);
        return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
      };
      const dateParts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
      const datePart = (type) => dateParts.find((part) => part.type === type).value;
      const today = `${datePart('year')}-${datePart('month')}-${datePart('day')}`;
      if (!validDate(body.rentalStart) || !validDate(body.rentalEnd)
        || body.rentalStart < today || body.rentalEnd < body.rentalStart) {
        return res.status(400).json({ error: 'Inserisci date valide: il ritiro non può essere nel passato e la riconsegna non può precederlo.' });
      }
      inquiryType = 'rental';
      rentalStart = body.rentalStart;
      rentalEnd = body.rentalEnd;
    } else if (body.rentalStart != null || body.rentalEnd != null) {
      return res.status(400).json({ error: 'Le date di noleggio sono valide solo per annunci di noleggio.' });
    }
  } else if (body.rentalStart != null || body.rentalEnd != null) {
    return res.status(400).json({ error: 'Seleziona un annuncio di noleggio.' });
  }
  await Inquiry.create({ name, email, phone, message, vehicleId, vehicleLabel, inquiryType, rentalStart, rentalEnd });
  return res.status(201).json({ message: inquiryType === 'rental'
    ? 'Richiesta inviata. Disponibilità e condizioni saranno confermate dalla concessionaria: non è una prenotazione.'
    : 'Grazie, il tuo messaggio è stato inviato. Ti ricontatteremo al più presto.' });
}));

app.post('/api/admin/login', route(async (req, res) => {
  if (isRateLimited(`login:${req.ip}`, 8, 15 * 60 * 1000)) {
    return res.status(429).json({ error: 'Troppi tentativi. Riprova tra 15 minuti.' });
  }
  const username = typeof req.body?.username === 'string' ? req.body.username : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const usernameMatches = username === process.env.ADMIN_USERNAME;
  const passwordMatches = process.env.ADMIN_PASSWORD_HASH
    ? await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH)
    : false;

  if (!usernameMatches || !passwordMatches) {
    return res.status(401).json({ error: 'Nome utente o password non corretti.' });
  }
  res.cookie(cookieName, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: sessionDurationMs,
  });
  return res.json({ username });
}));

app.get('/api/admin/session', adminOnly, (req, res) => {
  res.json({ username: process.env.ADMIN_USERNAME });
});

app.post('/api/admin/logout', adminOnly, (req, res) => {
  res.clearCookie(cookieName, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });
  res.json({ message: 'Disconnessione completata.' });
});

app.get('/api/admin/vehicles', adminOnly, route(async (req, res) => {
  const vehicles = await Vehicle.find().sort({ createdAt: -1 }).lean();
  res.json({ vehicles });
}));

app.post('/api/admin/vehicles', adminOnly, route(async (req, res) => {
  const { vehicle, error } = validateVehicle(req.body);
  if (error) return res.status(400).json({ error });
  const saved = await Vehicle.create(vehicle);
  return res.status(201).json({ vehicle: saved });
}));

app.put('/api/admin/vehicles/:id', adminOnly, route(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Auto non trovata.' });
  const { vehicle, error } = validateVehicle(req.body);
  if (error) return res.status(400).json({ error });
  const saved = await Vehicle.findByIdAndUpdate(req.params.id, vehicle, { new: true, runValidators: true });
  if (!saved) return res.status(404).json({ error: 'Auto non trovata.' });
  return res.json({ vehicle: saved });
}));

app.delete('/api/admin/vehicles/:id', adminOnly, route(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Auto non trovata.' });
  const deleted = await Vehicle.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Auto non trovata.' });
  return res.json({ message: 'Auto eliminata.' });
}));

app.get('/api/admin/inquiries', adminOnly, route(async (req, res) => {
  const inquiries = await Inquiry.find().sort({ createdAt: -1 }).limit(200).lean();
  res.json({ inquiries });
}));

app.patch('/api/admin/inquiries/:id', adminOnly, route(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Messaggio non trovato.' });
  if (req.body?.status !== 'handled') return res.status(400).json({ error: 'Stato non valido.' });
  const inquiry = await Inquiry.findByIdAndUpdate(req.params.id, { status: 'handled' }, { new: true });
  if (!inquiry) return res.status(404).json({ error: 'Messaggio non trovato.' });
  return res.json({ inquiry });
}));

const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  if (!req.accepts('html')) return next();
  return res.sendFile(path.join(clientDist, 'index.html'), (error) => {
    if (error) next(error);
  });
});

app.use((error, req, res, next) => {
  console.error('FREE API request failed:', error);
  if (res.headersSent) return next(error);
  if (error.type === 'entity.too.large') {
    const message = req.path === '/api/admin/site-logo'
      ? 'Il logo non può superare 5 MB.'
      : req.path === '/api/admin/vehicle-images'
        ? 'Ogni foto auto può pesare al massimo 8 MB.'
        : 'La richiesta supera la dimensione massima consentita.';
    return res.status(413).json({ error: message });
  }
  return res.status(500).json({ error: 'Errore del server. Riprova più tardi.' });
});

async function startServer() {
  if (!process.env.MONGO_URI) throw new Error('Configura MONGO_URI nel file .env.');
  if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD_HASH) {
    throw new Error('Configura ADMIN_USERNAME e ADMIN_PASSWORD_HASH nel file .env.');
  }
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
    throw new Error('SESSION_SECRET deve contenere almeno 32 caratteri.');
  }

  await mongoose.connect(process.env.MONGO_URI, { dbName: 'pelusogroup_free' });
  app.listen(port, () => {
    console.log(`Peluso Group FREE server listening on port ${port} (database: pelusogroup_free)`);
  });
}

startServer().catch((error) => {
  console.error('Peluso Group FREE startup failed:', error.message);
  process.exitCode = 1;
});
