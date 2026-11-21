import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const emptyVehicle = {
  brand: '',
  model: '',
  year: '',
  price: '',
  listingType: 'sale',
  rentalAvailable: true,
  rentalTerms: '',
  mileage: '',
  vatMode: 'inclusive',
  fuel: '',
  bodyType: '',
  transmission: '',
  engine: '',
  engineDisplacementCc: '',
  cylinders: '',
  power: '',
  powerCv: '',
  powerKw: '',
  color: '',
  drivetrain: '',
  doors: '',
  seats: '',
  condition: '',
  previousOwners: '',
  warrantyMonths: '',
  maintenanceHistory: '',
  emissionsClass: '',
  consumptionCombined: '',
  consumptionUnit: 'l/100 km',
  co2Emissions: '',
  torqueNm: '',
  accelerationSeconds: '',
  topSpeedKmh: '',
  trunkCapacityLitres: '',
  firstRegistration: '',
  inspectionYear: '',
  lastService: '',
  noviceDriverEligible: 'unknown',
  warrantyCoverage: [],
  label: '',
  installmentMonthlyAmount: '',
  installmentMonths: '',
  installmentTerms: '',
  additionalCosts: '',
  featuresText: '',
  additionalImagesText: '',
  imageUrl: '',
  description: '',
  isDemo: false,
};

const defaultSiteSettings = {
  vatRate: 22,
  email: 'info@example.com',
  phone: '+39 000 000 0000',
  whatsapp: '+39 000 000 0000',
  logoUrl: '/logo.png',
  publicAdmins: ['Luigi Peluso', 'Gerardo Peluso'],
  contactsAreReal: false,
  socialLinks: { facebook: '', instagram: '', tiktok: '', youtube: '' },
};

function settingsFormFrom(settings) {
  return {
    ...settings,
    socialLinks: { ...defaultSiteSettings.socialLinks, ...settings.socialLinks },
    vatRate: String(settings.vatRate),
    publicAdminsText: settings.publicAdmins.join('\n'),
  };
}

const warrantyCoverageOptions = [
  ['engine', 'Motore'],
  ['transmission', 'Cambio'],
  ['clutch', 'Frizione'],
  ['brakes', 'Freni'],
  ['turbo', 'Turbina'],
  ['electrical', 'Impianto elettrico'],
  ['airConditioning', 'Aria condizionata'],
  ['labor', 'Manodopera'],
];

const warrantyCoverageLabels = Object.fromEntries(warrantyCoverageOptions);

const vehicleSelectOptions = {
  condition: ['Nuova', 'Usata', 'Km 0', 'Ricondizionata'],
  fuel: ['Benzina', 'Diesel', 'Ibrida', 'Ibrida plug-in', 'Elettrica', 'GPL', 'Metano', 'Idrogeno'],
  bodyType: ['Berlina', 'Station wagon', 'SUV', 'Crossover', 'Hatchback', 'Coupé', 'Cabrio', 'Monovolume', 'Furgone'],
  transmission: ['Manuale', 'Automatico', 'Semiautomatico'],
  drivetrain: ['Anteriore', 'Posteriore', 'Integrale'],
  emissionsClass: ['Euro 3', 'Euro 4', 'Euro 5', 'Euro 6', 'Euro 6B', 'Euro 6C', 'Euro 6D', 'Euro 7'],
};

const dealership = {
  vatNumber: '04195760618',
  address: 'Via delle Monache, 17, 81030 Cellole (CE), Italia',
  mapUrl: 'https://www.google.com/maps/search/?api=1&query=Via+delle+Monache%2C+17%2C+81030+Cellole+CE+Italia',
  openingHours: [
    ['Lunedì', '09:00 – 13:00', '15:00 – 20:00'],
    ['Martedì', '09:00 – 13:00', '15:00 – 20:00'],
    ['Mercoledì', '09:00 – 13:00', '15:00 – 20:00'],
    ['Giovedì', '09:00 – 13:00', 'Pomeriggio chiuso'],
    ['Venerdì', '09:00 – 13:00', '15:00 – 20:00'],
    ['Sabato', '09:00 – 13:00', 'Pomeriggio chiuso'],
    ['Domenica', 'Chiuso', ''],
  ],
};

function VehicleIcon({ name, className = '' }) {
  const paths = {
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></>,
    road: <><path d="M7 3 3 21M17 3l4 18M12 3v3M12 10v4M12 18v3" /></>,
    fuel: <><path d="M5 21V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v17M3 21h14M7 7h6M15 8l3 3v6a2 2 0 0 0 4 0v-5l-3-3" /></>,
    gear: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.7 1.3-1.5 2.6-2.1-.8-.2.1-2.1 1.2-1 .1-.4 2.2h-3l-.4-2.2-1-.1-2.1-1.2-.2-.1-2.1.8-1.5-2.6 1.7-1.3.1-.1-.1-2.4-.1-.1L2.5 11l1.5-2.6 2.1.8.2-.1 2.1-1.2 1-.1.4-2.2h3l.4 2.2 1 .1 2.1 1.2.2.1 2.1-.8 1.5 2.6-1.7 1.3-.1.1.1 2.4Z" /></>,
    power: <><path d="m13 2-8 12h6l-1 8 9-13h-6l0-7Z" /></>,
    shield: <><path d="M12 3 4 6v6c0 5 3.4 8 8 10 4.6-2 8-5 8-10V6l-8-3Z" /><path d="m8 12 2.5 2.5L16 9" /></>,
    phone: <><path d="M7 3H4a1 1 0 0 0-1 1c0 9.4 7.6 17 17 17a1 1 0 0 0 1-1v-3l-5-2-2 2c-3.4-1.5-6-4.1-7.5-7.5l2-2-2-5Z" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    share: <><circle cx="18" cy="5" r="2" /><circle cx="6" cy="12" r="2" /><circle cx="18" cy="19" r="2" /><path d="m8 11 8-5M8 13l8 5" /></>,
    expand: <><path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5" /></>,
  };
  return <svg className={`vehicle-svg ${className}`} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function VehicleSelect({ label, field, value, options, onChange }) {
  const allOptions = value && !options.includes(value) ? [value, ...options] : options;
  return (
    <label>{label}
      <select value={value} onChange={(event) => onChange(field, event.target.value)}>
        <option value="">Non specificato</option>
        {allOptions.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function WhatsAppIcon({ className = '' }) {
  return (
    <svg className={`whatsapp-icon ${className}`} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.5 11.6a8.5 8.5 0 0 1-12.6 7.5L3 20.5l1.4-4.7a8.5 8.5 0 1 1 16.1-4.2Z" />
      <path d="M8.1 7.5c.3-.3.8-.3 1.1.1l1.1 1.6c.2.3.2.7-.1 1l-.7.8c.8 1.5 2 2.7 3.5 3.5l.8-.7c.3-.3.7-.3 1-.1l1.6 1.1c.4.3.4.8.1 1.1-.7.8-1.6 1.1-2.6.8-3.7-1.1-6.3-3.7-7.4-7.4-.3-1 .1-1.9.8-2.6Z" />
    </svg>
  );
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    credentials: 'same-origin',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'Si è verificato un errore. Riprova.');
  return result;
}

function price(value) {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

function monthlyPrice(value) {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(value);
}

function isRental(vehicle) {
  return vehicle.listingType === 'rental';
}

function listingPrice(vehicle) {
  return isRental(vehicle) ? `${monthlyPrice(vehicle.price)} / giorno` : price(vehicle.price);
}

function mileage(value) {
  return `${Number(value || 0).toLocaleString('it-IT')} km`;
}

function formatVatRate(value) {
  return new Intl.NumberFormat('it-IT', { maximumFractionDigits: 2 }).format(Number(value));
}

function specKey(value) {
  return String(value || '').trim().toLocaleLowerCase('it-IT');
}

function vatDescription(vehicle, vatRate) {
  if (vehicle.vatMode === 'exclusive') return `IVA esclusa · ${formatVatRate(vatRate)}% da aggiungere`;
  if (vehicle.vatMode === 'not-applied') return 'IVA non applicata';
  return 'IVA inclusa';
}

function similarVehicles(vehicle, vehicles) {
  const same = (a, b) => a && b && a.trim().toLocaleLowerCase('it-IT') === b.trim().toLocaleLowerCase('it-IT');
  return vehicles.filter((item) => item._id !== vehicle._id && Boolean(item.isDemo) === Boolean(vehicle.isDemo) && isRental(item) === isRental(vehicle))
    .map((item) => ({
      item,
      score: (same(vehicle.brand, item.brand) ? 4 : 0)
        + (same(vehicle.bodyType, item.bodyType) ? 3 : 0),
      fuelMatch: same(vehicle.fuel, item.fuel) ? 1 : 0,
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || b.fuelMatch - a.fuelMatch || Math.abs(a.item.price - vehicle.price) - Math.abs(b.item.price - vehicle.price))
    .slice(0, 3).map(({ item }) => item);
}

function getVehicleIdFromPath() {
  const match = window.location.pathname.match(/^\/auto\/([^/]+)\/?$/);
  if (!match) return '';
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

function getVehicleImages(vehicle) {
  const images = Array.isArray(vehicle.images) ? vehicle.images.filter(Boolean) : [];
  if (images.length) return images;
  return vehicle.imageUrl ? [vehicle.imageUrl] : [];
}

function getVehicleSpecificationGroups(vehicle) {
  const power = [
    vehicle.powerCv != null ? `${vehicle.powerCv} CV` : '',
    vehicle.powerKw != null ? `${vehicle.powerKw} kW` : '',
  ].filter(Boolean).join(' · ') || vehicle.power || '';
  const warrantyCoverage = Array.isArray(vehicle.warrantyCoverage)
    ? vehicle.warrantyCoverage.map((item) => warrantyCoverageLabels[item]).filter(Boolean).join(', ')
    : '';
  const noviceDriver = vehicle.noviceDriverEligible === 'yes'
    ? 'Sì'
    : vehicle.noviceDriverEligible === 'no'
      ? 'No'
      : '';
  const installmentPlan = vehicle.installmentPlan;
  const groups = [
    {
      title: 'Caratteristiche',
      icon: 'calendar',
      specifications: [
        ['Anno', vehicle.year],
        ['Prima immatricolazione', vehicle.firstRegistration],
        ['Chilometraggio', vehicle.mileage == null || vehicle.mileage === '' ? '' : mileage(vehicle.mileage)],
        ['Carrozzeria', vehicle.bodyType],
        ['Colore', vehicle.color],
        ['Porte', vehicle.doors],
        ['Posti', vehicle.seats],
        ['Capacità bagagliaio', vehicle.trunkCapacityLitres != null ? `${vehicle.trunkCapacityLitres} litri` : ''],
      ],
    },
    {
      title: 'Motore e trasmissione',
      icon: 'power',
      specifications: [
        ['Alimentazione', vehicle.fuel],
        ['Motore', vehicle.engine],
        ['Cilindrata', vehicle.engineDisplacementCc != null ? `${Number(vehicle.engineDisplacementCc).toLocaleString('it-IT')} cm³` : ''],
        ['Cilindri', vehicle.cylinders],
        ['Potenza', power],
        ['Cambio', vehicle.transmission],
        ['Trazione', vehicle.drivetrain],
      ],
    },
    {
      title: 'Prestazioni e consumi',
      icon: 'road',
      specifications: [
        ['Coppia', vehicle.torqueNm != null ? `${vehicle.torqueNm} Nm` : ''],
        ['0–100 km/h', vehicle.accelerationSeconds != null ? `${vehicle.accelerationSeconds} s` : ''],
        ['Velocità massima', vehicle.topSpeedKmh != null ? `${vehicle.topSpeedKmh} km/h` : ''],
        ['Consumo combinato', vehicle.consumptionCombined != null ? `${vehicle.consumptionCombined} ${vehicle.consumptionUnit || 'l/100 km'}` : ''],
        ['Emissioni CO₂', vehicle.co2Emissions != null ? `${vehicle.co2Emissions} g/km` : ''],
        ['Classe emissioni', vehicle.emissionsClass],
      ],
    },
    {
      title: 'Condizioni e coperture',
      icon: 'shield',
      specifications: [
        ['Condizione', vehicle.condition],
        ['Proprietari precedenti', vehicle.previousOwners],
        ['Garanzia', vehicle.warrantyMonths == null ? '' : vehicle.warrantyMonths === 0 ? 'Non prevista' : `${vehicle.warrantyMonths} mesi`],
        ['Componenti coperti', warrantyCoverage],
        ['Ultimo tagliando', vehicle.lastService],
        ['Revisione (anno)', vehicle.inspectionYear],
        ['Idoneità neopatentati', noviceDriver],
        ['Categoria', vehicle.label],
      ],
    },
    ...(!isRental(vehicle) ? [{
      title: 'Piano rateale',
      icon: 'calendar',
      specifications: [
        ['Rata mensile', installmentPlan?.monthlyAmount != null ? monthlyPrice(installmentPlan.monthlyAmount) : ''],
        ['Durata', installmentPlan?.months != null ? `${installmentPlan.months} mesi` : ''],
      ],
    }] : []),
  ];

  return groups.map((group) => ({
    ...group,
    specifications: group.specifications.map(([label, value]) => [
      label,
      value == null || (typeof value === 'string' && !value.trim()) ? 'Non specificato' : value,
    ]),
  }));
}

function VehicleCard({ vehicle, onOpen, vatRate }) {
  const images = getVehicleImages(vehicle);
  const href = `/auto/${encodeURIComponent(vehicle._id)}`;
  return (
    <a
      className="vehicle-card"
      href={href}
      onClick={(event) => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        onOpen(vehicle._id);
      }}
      aria-label={`Apri scheda ${vehicle.brand} ${vehicle.model}`}
    >
      {images[0] ? (
        <img className="vehicle-image" src={images[0]} alt={`${vehicle.brand} ${vehicle.model}`} loading="lazy" />
      ) : (
        <div className="vehicle-placeholder" aria-label="Foto non disponibile">PG</div>
      )}
      <div className="vehicle-content">
        {vehicle.isDemo ? <span className="demo-badge">DEMO · NON DISPONIBILE</span> : null}
        <p className="vehicle-year">{isRental(vehicle) ? 'NOLEGGIO' : 'VENDITA'}</p>
        <p className="vehicle-year">{vehicle.year}{vehicle.bodyType ? ` · ${vehicle.bodyType}` : ''}</p>
        <h3>{vehicle.brand} {vehicle.model}</h3>
        <div className="vehicle-highlights">
          <span>{mileage(vehicle.mileage)}</span>
          {vehicle.fuel ? <span>{vehicle.fuel}</span> : null}
          {vehicle.transmission ? <span>{vehicle.transmission}</span> : null}
        </div>
        {vehicle.description ? <p className="vehicle-description">{vehicle.description}</p> : null}
        <div className="vehicle-card-bottom">
          <div>
            <p className="vehicle-price">{listingPrice(vehicle)}</p>
            {isRental(vehicle) && vehicle.rentalAvailable === false ? <p className="vehicle-vat-note">Richieste temporaneamente sospese</p> : null}
            {vehicle.vatMode === 'exclusive' ? <p className="vehicle-vat-note">IVA esclusa · {formatVatRate(vatRate)}% da aggiungere</p> : null}
            {vehicle.vatMode === 'not-applied' ? <p className="vehicle-vat-note">IVA non applicata</p> : null}
          </div>
          <span className="vehicle-open-link">Scopri <span aria-hidden="true">↗</span></span>
        </div>
      </div>
    </a>
  );
}

function VehicleDetail({ vehicle, otherVehicles, onBack, onContact, onOpen, vatRate, siteSettings }) {
  const images = getVehicleImages(vehicle);
  const firstImage = images[0] || '';
  const [activeImage, setActiveImage] = useState(firstImage);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const specificationGroups = getVehicleSpecificationGroups(vehicle);
  const features = Array.isArray(vehicle.features) ? vehicle.features.filter(Boolean) : [];
  const relatedVehicles = similarVehicles(vehicle, otherVehicles);
  const imageIndex = Math.max(0, images.indexOf(activeImage));
  const power = [vehicle.powerCv != null ? `${vehicle.powerCv} CV` : '', vehicle.powerKw != null ? `${vehicle.powerKw} kW` : ''].filter(Boolean).join(' · ') || vehicle.power;
  const essentials = [
    ['gear', 'Cambio', vehicle.transmission || 'Non specificato'],
    ['power', 'Potenza', power || 'Non specificata'],
    ['calendar', 'Immatricolazione', vehicle.firstRegistration || 'Non specificata'],
    ['shield', 'Garanzia', vehicle.warrantyMonths == null ? 'Non specificata' : vehicle.warrantyMonths === 0 ? 'Non prevista' : `${vehicle.warrantyMonths} mesi`],
  ];

  useEffect(() => {
    setActiveImage(firstImage);
    setGalleryOpen(false);
    setShareMessage('');
  }, [vehicle._id, firstImage]);

  const changeImage = (offset) => {
    setActiveImage(images[(imageIndex + offset + images.length) % images.length]);
  };
  const shareVehicle = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: `${vehicle.brand} ${vehicle.model}`, url: window.location.href });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        setShareMessage('Link copiato.');
      } else {
        setShareMessage('Copia il link dalla barra degli indirizzi.');
      }
    } catch (error) {
      if (error.name !== 'AbortError') setShareMessage('Impossibile condividere: copia il link dalla barra degli indirizzi.');
    }
  };

  return (
    <div className="vehicle-detail section-wrap">
      <button className="back-link" onClick={onBack}><span aria-hidden="true">←</span> Tutte le auto</button>
      <div className="detail-layout">
        <div className="detail-gallery">
          {activeImage ? (
            <button type="button" className="detail-image-button" onClick={() => setGalleryOpen(true)} aria-label="Ingrandisci foto">
              <img className="detail-main-image" src={activeImage} alt={`${vehicle.brand} ${vehicle.model}`} />
              <span><VehicleIcon name="expand" /> Ingrandisci · {imageIndex + 1} / {images.length}</span>
            </button>
          ) : (
            <div className="vehicle-placeholder detail-main-image">PG</div>
          )}
          {images.length > 1 ? (
            <div className="detail-thumbnails" aria-label="Foto dell'auto">
              {images.map((image, index) => (
                <button
                  className={image === activeImage ? 'active' : ''}
                  key={`${image}-${index}`}
                  onClick={() => setActiveImage(image)}
                  aria-label={`Mostra foto ${index + 1}`}
                  aria-pressed={image === activeImage}
                >
                  <img src={image} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <section className="detail-summary">
          {vehicle.isDemo ? <span className="demo-badge">DEMO · NON DISPONIBILE</span> : null}
          <p className="eyebrow">{vehicle.isDemo ? 'SCHEDA DIMOSTRATIVA' : isRental(vehicle) ? 'AUTO A NOLEGGIO' : vehicle.bodyType || 'AUTO IN VETRINA'} · {vehicle.year}</p>
          <h1>{vehicle.brand} {vehicle.model}</h1>
          <p className="detail-mileage">{vehicle.mileage == null || vehicle.mileage === '' ? 'Chilometraggio non specificato' : mileage(vehicle.mileage)}{vehicle.fuel ? ` · ${vehicle.fuel}` : ''}</p>
          <p className="detail-price">{listingPrice(vehicle)}</p>
          <p className="detail-vat">{vatDescription(vehicle, vatRate)}</p>
          {vehicle.vatMode === 'exclusive' ? <p className="detail-vat">Prezzo con IVA indicativa: {monthlyPrice(vehicle.price * (1 + vatRate / 100))}{isRental(vehicle) ? ' / giorno' : ''}</p> : null}
          <p className="detail-costs">Costi aggiuntivi: {vehicle.additionalCosts || 'Non specificato'}</p>
          <p className="detail-description">{vehicle.description || 'Descrizione non specificata.'}</p>
          <dl className="detail-essentials">{essentials.map(([icon, label, value]) => <div key={label}><VehicleIcon name={icon} /><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
          {isRental(vehicle) ? <p className="detail-contact-note">Disponibilità e condizioni da confermare con la concessionaria. La richiesta non è una prenotazione.</p> : null}
          {!vehicle.isDemo ? (
            <div className="detail-actions">
              {isRental(vehicle) && vehicle.rentalAvailable === false ? <p>Richieste di noleggio temporaneamente sospese.</p> : <button className="button button-dark detail-contact-button" onClick={() => onContact(vehicle)}>{isRental(vehicle) ? 'Richiedi noleggio' : 'Richiedi informazioni'} <span aria-hidden="true">→</span></button>}
              {siteSettings.contactsAreReal && siteSettings.email ? <a className="button button-light" href={`mailto:${siteSettings.email}?subject=${encodeURIComponent(`Informazioni ${vehicle.brand} ${vehicle.model} - ${vehicle._id}`)}`}>Email</a> : null}
              {siteSettings.contactsAreReal && siteSettings.phone ? <a className="button button-light" href={`tel:${siteSettings.phone.replace(/[^\d+]/g, '')}`}>Chiama</a> : null}
              {siteSettings.contactsAreReal && siteSettings.whatsapp ? <a className="button button-light" href={`https://wa.me/${siteSettings.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Buongiorno, vorrei informazioni sulla ${vehicle.brand} ${vehicle.model} (annuncio ${vehicle._id}).`)}`} target="_blank" rel="noreferrer">WhatsApp</a> : null}
            </div>
          ) : <p className="demo-disclaimer detail-demo-note">Annuncio dimostrativo: non è possibile richiedere questa auto.</p>}
          <button className="text-link detail-share" type="button" onClick={shareVehicle}><VehicleIcon name="share" /> Condividi annuncio</button>
          {shareMessage ? <p className="detail-contact-note" role="status">{shareMessage}</p> : null}
        </section>
      </div>

      <section className="detail-specs">
        <div className="detail-section-heading">
          <p className="eyebrow">INFORMAZIONI</p>
          <h2>Scheda tecnica</h2>
        </div>
        <div className="specification-groups">
          {specificationGroups.map((group) => (
            <section className="specification-group" key={group.title}>
              <h3><VehicleIcon name={group.icon} /> {group.title}</h3>
              <dl className="specification-grid">
                {group.specifications.map(([label, value]) => (
                  <div className="specification-item" key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
        {isRental(vehicle)
          ? <p className="detail-finance">Condizioni del noleggio: {vehicle.rentalTerms || 'Non specificato'}</p>
          : <p className="detail-finance">Condizioni del piano rateale: {vehicle.installmentPlan?.terms || 'Non specificato'}</p>}
      </section>

      <section className="detail-extra">
        <div>
          <p className="eyebrow">MANUTENZIONE</p>
          <h2>Storico e note</h2>
          <p>{vehicle.maintenanceHistory || 'Non specificato'}</p>
        </div>
        <div>
          <p className="eyebrow">DOTAZIONI</p>
          <h2>Equipaggiamento</h2>
          {features.length ? <ul className="feature-list">{features.map((feature) => <li key={feature}>{feature}</li>)}</ul> : <p>Non specificato</p>}
        </div>
      </section>

      {vehicle.isDemo ? (
        <p className="demo-disclaimer">Questa è una scheda dimostrativa: i dati e il prezzo non rappresentano un’offerta reale.</p>
      ) : null}

      {relatedVehicles.length ? (
        <section className="more-vehicles">
          <div className="detail-section-heading">
            <p className="eyebrow">LA NOSTRA SELEZIONE</p>
            <h2>Auto simili</h2>
          </div>
          <div className="vehicle-grid">
            {relatedVehicles.map((item) => (
              <VehicleCard key={item._id} vehicle={item} onOpen={onOpen} vatRate={vatRate} />
            ))}
          </div>
        </section>
      ) : null}
      {!vehicle.isDemo && (!isRental(vehicle) || vehicle.rentalAvailable !== false) ? <div className="detail-mobile-action"><button className="button button-dark" onClick={() => onContact(vehicle)}>{isRental(vehicle) ? 'Richiedi noleggio' : 'Richiedi informazioni'} <span aria-hidden="true">→</span></button></div> : null}
      {galleryOpen ? (
        <SiteDialog className="gallery-dialog" titleId="gallery-title" descriptionId="gallery-description" onCancel={() => setGalleryOpen(false)} onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') changeImage(-1);
          if (event.key === 'ArrowRight') changeImage(1);
        }}>
          <div className="gallery-heading"><h2 id="gallery-title">Foto {vehicle.brand} {vehicle.model}</h2><button className="icon-button" autoFocus aria-label="Chiudi galleria" onClick={() => setGalleryOpen(false)}>×</button></div>
          <p id="gallery-description">Foto {imageIndex + 1} di {images.length}</p>
          <img className="gallery-full-image" src={activeImage} alt={`${vehicle.brand} ${vehicle.model}, foto ${imageIndex + 1}`} />
          {images.length > 1 ? <div className="gallery-controls"><button className="button button-light" onClick={() => changeImage(-1)}>← Precedente</button><button className="button button-light" onClick={() => changeImage(1)}>Successiva →</button></div> : null}
        </SiteDialog>
      ) : null}
    </div>
  );
}

function SiteDialog({ titleId, descriptionId, onCancel, children, role, className = 'confirm-dialog', onKeyDown }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className={className}
      role={role}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onKeyDown={(event) => { event.stopPropagation(); if (onKeyDown) onKeyDown(event); }}
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
    >
      {children}
    </dialog>
  );
}

function DeleteVehicleDialog({ vehicle, busy, error, onCancel, onConfirm }) {
  return (
    <SiteDialog titleId="delete-vehicle-title" descriptionId="delete-vehicle-description" onCancel={() => { if (!busy) onCancel(); }}>
      <p className="eyebrow">GESTIONE INVENTARIO</p>
      <h2 id="delete-vehicle-title">Eliminare questa auto?</h2>
      <p id="delete-vehicle-description">L’annuncio {vehicle.brand} {vehicle.model} sarà rimosso dalla vetrina. Questa operazione non può essere annullata.</p>
      {error ? <p className="notice notice-error" role="alert">{error}</p> : null}
      <div className="confirm-actions">
        <button type="button" className="button button-light" onClick={onCancel} disabled={busy} autoFocus>Annulla</button>
        <button type="button" className="button button-danger" onClick={onConfirm} disabled={busy}>{busy ? 'Eliminazione…' : 'Elimina auto'}</button>
      </div>
    </SiteDialog>
  );
}

function DealerContactDialog({ vehicle, settings, onClose }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [rentalStart, setRentalStart] = useState('');
  const dateParts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const datePart = (type) => dateParts.find((part) => part.type === type).value;
  const today = `${datePart('year')}-${datePart('month')}-${datePart('day')}`;
  const submit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setError('');
    try {
      if (isRental(vehicle)) {
        const capabilities = await request('/api/vehicles');
        if (capabilities.rentalSupported !== true) throw new Error('Il noleggio non è ancora disponibile. Contatta la concessionaria per informazioni.');
      }
      const result = await request('/api/contact', {
        method: 'POST',
        body: JSON.stringify({
          name: data.get('name'),
          email: data.get('email'),
          phone: data.get('phone'),
          message: data.get('message'),
          vehicleId: vehicle._id,
          ...(isRental(vehicle) ? { rentalStart: data.get('rentalStart'), rentalEnd: data.get('rentalEnd') } : {}),
        }),
      });
      setSuccess(result.message);
      form.reset();
      setRentalStart('');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <SiteDialog className="dealer-contact-dialog" titleId="dealer-contact-title" descriptionId="dealer-contact-description" onCancel={onClose}>
      <button className="icon-button dealer-contact-close" aria-label="Chiudi" onClick={onClose}>×</button>
      <p className="eyebrow">PELUSO GROUP</p>
      <h2 id="dealer-contact-title">{isRental(vehicle) ? 'Richiedi il noleggio' : 'Contatta la concessionaria'}</h2>
      <p id="dealer-contact-description">La richiesta verrà collegata a {vehicle.brand} {vehicle.model} · {vehicle.year}.{isRental(vehicle) ? ' Non è una prenotazione: disponibilità e condizioni saranno confermate dalla concessionaria.' : ''}</p>
      {settings.contactsAreReal && (settings.phone || settings.whatsapp || settings.email) ? (
        <div className="dealer-quick-contacts">
          {settings.phone ? <a href={`tel:${settings.phone.replace(/[^\d+]/g, '')}`}><VehicleIcon name="phone" /><span>Chiama</span><strong>{settings.phone}</strong></a> : null}
          {settings.whatsapp ? <a href={`https://wa.me/${settings.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Buongiorno, vorrei informazioni sulla ${vehicle.brand} ${vehicle.model} (annuncio ${vehicle._id}).`)}`} target="_blank" rel="noreferrer"><VehicleIcon name="phone" /><span>WhatsApp</span><strong>{settings.whatsapp}</strong></a> : null}
          {settings.email ? <a href={`mailto:${settings.email}?subject=${encodeURIComponent(`Informazioni ${vehicle.brand} ${vehicle.model}`)}`}><VehicleIcon name="mail" /><span>Email</span><strong>{settings.email}</strong></a> : null}
        </div>
      ) : null}
      <form className="dealer-contact-form" onSubmit={submit}>
        <div className="form-row">
          <label>Nome<input name="name" autoComplete="name" minLength="2" maxLength="80" required /></label>
          <label>Telefono <span className="optional">(facoltativo)</span><input name="phone" type="tel" autoComplete="tel" maxLength="40" /></label>
        </div>
        <label>Email<input name="email" type="email" autoComplete="email" maxLength="254" required /></label>
        {isRental(vehicle) ? <div className="form-row">
          <label>Data ritiro<input type="date" name="rentalStart" value={rentalStart} min={today} onChange={(event) => setRentalStart(event.target.value)} required /></label>
          <label>Data riconsegna<input type="date" name="rentalEnd" min={rentalStart} required /></label>
        </div> : null}
        <label>Messaggio<textarea name="message" rows="4" minLength="10" maxLength="2000" defaultValue={`Buongiorno, vorrei ricevere informazioni ${isRental(vehicle) ? 'sul noleggio della' : 'sulla'} ${vehicle.brand} ${vehicle.model} (${vehicle.year}).`} required /></label>
        {error ? <p className="notice notice-error" role="alert">{error}</p> : null}
        {success ? <p className="notice notice-success" role="status">{success}</p> : null}
        <button className="button button-dark" disabled={busy || Boolean(success)}>{busy ? 'Invio in corso…' : 'Invia richiesta'}</button>
      </form>
    </SiteDialog>
  );
}

function App() {
  const [vehicles, setVehicles] = useState([]);
  const [vehiclesLoaded, setVehiclesLoaded] = useState(false);
  const [rentalSupported, setRentalSupported] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState(getVehicleIdFromPath);
  const [scrollTarget, setScrollTarget] = useState('');
  const [pageError, setPageError] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactError, setContactError] = useState('');
  const [contactBusy, setContactBusy] = useState(false);
  const [contactText, setContactText] = useState('');
  const [contactVehicle, setContactVehicle] = useState(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminTab, setAdminTab] = useState('vehicles');
  const [adminError, setAdminError] = useState('');
  const [adminBusy, setAdminBusy] = useState(false);
  const [siteSettings, setSiteSettings] = useState(defaultSiteSettings);
  const [siteSettingsForm, setSiteSettingsForm] = useState(() => settingsFormFrom(defaultSiteSettings));
  const [siteSettingsError, setSiteSettingsError] = useState('');
  const [siteSettingsMessage, setSiteSettingsMessage] = useState('');
  const [logoUploadBusy, setLogoUploadBusy] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState('');
  const [logoVisible, setLogoVisible] = useState(true);
  const [imageUploadBusy, setImageUploadBusy] = useState(false);
  const [imageUploadError, setImageUploadError] = useState('');
  const [adminNeedsLoad, setAdminNeedsLoad] = useState(false);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [adminVehicleQuery, setAdminVehicleQuery] = useState('');
  const [inquiryQuery, setInquiryQuery] = useState('');
  const [inquiryFilter, setInquiryFilter] = useState('open');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [adminVehicles, setAdminVehicles] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [editingId, setEditingId] = useState('');
  const [vehicleForm, setVehicleForm] = useState(emptyVehicle);
  const [vehicleToDelete, setVehicleToDelete] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [dealerContactVehicle, setDealerContactVehicle] = useState(null);
  const [catalogFilters, setCatalogFilters] = useState({ search: '', listingType: '', brand: '', fuel: '', bodyType: '', transmission: '', maxPrice: '', sort: 'newest' });

  const selectedVehicle = vehicles.find((vehicle) => vehicle._id === selectedVehicleId);
  const priceFilterType = catalogFilters.listingType || (vehicles.some(isRental) ? '' : 'sale');
  const vehicleFormImageUrls = useMemo(() => [...new Set([
    vehicleForm.imageUrl,
    ...vehicleForm.additionalImagesText.split('\n'),
  ].map((image) => image.trim()).filter(Boolean))], [vehicleForm.additionalImagesText, vehicleForm.imageUrl]);
  const filteredAdminVehicles = useMemo(() => {
    const query = adminVehicleQuery.trim().toLocaleLowerCase('it-IT');
    if (!query) return adminVehicles;
    return adminVehicles.filter((vehicle) => `${vehicle.brand} ${vehicle.model} ${vehicle.year}`
      .toLocaleLowerCase('it-IT').includes(query));
  }, [adminVehicleQuery, adminVehicles]);
  const filteredInquiries = useMemo(() => inquiries.filter((inquiry) => {
    if (inquiryFilter !== 'all' && inquiry.status !== inquiryFilter) return false;
    const query = inquiryQuery.trim().toLocaleLowerCase('it-IT');
    return !query || `${inquiry.name} ${inquiry.email} ${inquiry.message}`
      .toLocaleLowerCase('it-IT').includes(query);
  }), [inquiries, inquiryFilter, inquiryQuery]);
  const filteredVehicles = useMemo(() => {
    const query = catalogFilters.search.trim().toLocaleLowerCase('it-IT');
    const filtered = vehicles.filter((vehicle) => (
      (!query || `${vehicle.brand} ${vehicle.model} ${vehicle.year}`.toLocaleLowerCase('it-IT').includes(query))
      && (!catalogFilters.listingType || (isRental(vehicle) ? 'rental' : 'sale') === catalogFilters.listingType)
      && (!catalogFilters.brand || vehicle.brand === catalogFilters.brand)
      && (!catalogFilters.fuel || specKey(vehicle.fuel) === specKey(catalogFilters.fuel))
      && (!catalogFilters.bodyType || specKey(vehicle.bodyType) === specKey(catalogFilters.bodyType))
      && (!catalogFilters.transmission || specKey(vehicle.transmission) === specKey(catalogFilters.transmission))
      && (!catalogFilters.maxPrice || vehicle.price <= Number(catalogFilters.maxPrice))
    ));
    return [...filtered].sort((a, b) => {
      if (catalogFilters.sort === 'price-asc') return a.price - b.price;
      if (catalogFilters.sort === 'price-desc') return b.price - a.price;
      if (catalogFilters.sort === 'mileage') return a.mileage - b.mileage;
      if (catalogFilters.sort === 'year') return b.year - a.year;
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
  }, [catalogFilters, vehicles]);
  const catalogOptions = useMemo(() => {
    const uniqueSpecs = (key) => [...vehicles.map((item) => item[key]).filter(Boolean)
      .reduce((values, value) => values.has(specKey(value)) ? values : values.set(specKey(value), value), new Map()).values()]
      .sort((a, b) => a.localeCompare(b, 'it'));
    return {
      brand: uniqueSpecs('brand'),
      fuel: uniqueSpecs('fuel'),
      bodyType: uniqueSpecs('bodyType'),
      transmission: uniqueSpecs('transmission'),
    };
  }, [vehicles]);

  const loadVehicles = useCallback(async () => {
    try {
      const result = await request('/api/vehicles');
      setVehicles(result.vehicles);
      if (result.vehicles.some(isRental)) {
        setCatalogFilters((current) => current.listingType ? current : {
          ...current,
          maxPrice: '',
          sort: current.sort.startsWith('price-') ? 'newest' : current.sort,
        });
      }
      setRentalSupported(result.rentalSupported === true);
      setVehiclesLoaded(true);
      setPageError('');
    } catch (error) {
      setVehiclesLoaded(true);
      setPageError(error.message);
    }
  }, []);

  const loadSiteSettings = useCallback(async () => {
    try {
      const result = await request('/api/site-settings');
      const settings = { ...defaultSiteSettings, ...result.settings };
      setSiteSettings(settings);
      setSiteSettingsForm(settingsFormFrom(settings));
      setSiteSettingsError('');
    } catch (error) {
      setSiteSettingsError(error.message);
    }
  }, []);

  useEffect(() => {
    setLogoVisible(true);
  }, [siteSettings.logoUrl]);

  useEffect(() => {
    loadVehicles();
    loadSiteSettings();
    request('/api/admin/session')
      .then((session) => {
        setIsAdmin(true);
        setUsername(session.username);
        setAdminNeedsLoad(true);
      })
      .catch(() => setIsAdmin(false));
  }, [loadSiteSettings, loadVehicles]);

  useEffect(() => {
    const onPopState = () => {
      setSelectedVehicleId(getVehicleIdFromPath());
      setScrollTarget('');
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    if (scrollTarget && !selectedVehicleId) {
      window.requestAnimationFrame(() => {
        document.getElementById(scrollTarget)?.scrollIntoView({ behavior: 'smooth' });
      });
      setScrollTarget('');
    }
  }, [scrollTarget, selectedVehicleId]);

  useEffect(() => {
    document.title = selectedVehicle
      ? `${selectedVehicle.brand} ${selectedVehicle.model} — Peluso Group`
      : 'Peluso Group — Auto in vendita e noleggio';
  }, [selectedVehicle]);

  useEffect(() => {
    if (!adminOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setAdminOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [adminOpen]);

  const openVehicle = (id) => {
    window.history.pushState({}, '', `/auto/${encodeURIComponent(id)}`);
    setSelectedVehicleId(String(id));
    setScrollTarget('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateHome = (section = '') => {
    window.history.pushState({}, '', section ? `/#${section}` : '/');
    setSelectedVehicleId('');
    setScrollTarget(section);
    if (!section) window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const contactAboutVehicle = (vehicle) => {
    setDealerContactVehicle(vehicle);
  };

  const loadAdminData = useCallback(async () => {
    setAdminBusy(true);
    setAdminError('');
    try {
      const [vehicleResult, inquiryResult, settingsResult] = await Promise.all([
        request('/api/admin/vehicles'),
        request('/api/admin/inquiries'),
        request('/api/site-settings'),
      ]);
      setAdminVehicles(vehicleResult.vehicles);
      setInquiries(inquiryResult.inquiries);
      const settings = { ...defaultSiteSettings, ...settingsResult.settings };
      setSiteSettings(settings);
      setSiteSettingsForm(settingsFormFrom(settings));
      setSiteSettingsError('');
    } catch (error) {
      setAdminError(error.message);
    } finally {
      setAdminBusy(false);
    }
  }, []);

  useEffect(() => {
    if (adminOpen && isAdmin && adminNeedsLoad) {
      setAdminNeedsLoad(false);
      loadAdminData();
    }
  }, [adminNeedsLoad, adminOpen, isAdmin, loadAdminData]);

  const openAdmin = () => {
    setAdminOpen(true);
    setAdminError('');
    setAdminNeedsLoad(true);
  };

  const submitContact = async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    setContactBusy(true);
    setContactError('');
    setContactMessage('');
    const form = new FormData(formElement);
    try {
      const result = await request('/api/contact', {
        method: 'POST',
        body: JSON.stringify({
          name: form.get('name'),
          email: form.get('email'),
          phone: form.get('phone'),
          message: form.get('message'),
          vehicleId: contactVehicle?._id || null,
        }),
      });
      setContactMessage(result.message);
      formElement.reset();
      setContactText('');
      setContactVehicle(null);
    } catch (error) {
      setContactError(error.message);
    } finally {
      setContactBusy(false);
    }
  };

  const submitLogin = async (event) => {
    event.preventDefault();
    setAdminBusy(true);
    setAdminError('');
    try {
      await request('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      setIsAdmin(true);
      setAdminNeedsLoad(true);
      setPassword('');
    } catch (error) {
      setAdminError(error.message);
    } finally {
      setAdminBusy(false);
    }
  };

  const saveVehicle = async (event) => {
    event.preventDefault();
    const hasInstallmentAmount = vehicleForm.listingType === 'sale' && vehicleForm.installmentMonthlyAmount !== '';
    const hasInstallmentMonths = vehicleForm.listingType === 'sale' && vehicleForm.installmentMonths !== '';
    if (hasInstallmentAmount !== hasInstallmentMonths) {
      setAdminError('Per il piano rateale inserisci sia la rata mensile sia la durata, oppure lascia entrambi i campi vuoti.');
      return;
    }
    setAdminBusy(true);
    setAdminError('');
    const {
      featuresText,
      additionalImagesText,
      installmentMonthlyAmount,
      installmentMonths,
      installmentTerms,
      ...vehicleData
    } = vehicleForm;
    const images = [...new Set([vehicleData.imageUrl, ...additionalImagesText.split('\n')]
      .map((image) => image.trim()).filter(Boolean))];
    try {
      if (vehicleData.listingType === 'rental' || (editingId && isRental(adminVehicles.find((vehicle) => vehicle._id === editingId) || {}))) {
        const capabilities = await request('/api/vehicles');
        if (capabilities.rentalSupported !== true) throw new Error('Il server non supporta ancora il noleggio. Riavvia il backend aggiornato prima di pubblicare.');
      }
      await request(editingId ? `/api/admin/vehicles/${editingId}` : '/api/admin/vehicles', {
        method: editingId ? 'PUT' : 'POST',
        body: JSON.stringify({
          ...vehicleData,
          imageUrl: images[0] || '',
          images,
          installmentPlan: vehicleData.listingType === 'sale' ? { monthlyAmount: installmentMonthlyAmount, months: installmentMonths, terms: installmentTerms } : null,
          features: featuresText.split('\n').map((feature) => feature.trim()).filter(Boolean),
        }),
      });
      setVehicleForm(emptyVehicle);
      setEditingId('');
      setShowVehicleForm(false);
      await Promise.all([loadAdminData(), loadVehicles()]);
    } catch (error) {
      setAdminError(error.message);
    } finally {
      setAdminBusy(false);
    }
  };

  const editVehicle = (vehicle) => {
    setEditingId(vehicle._id);
    setShowVehicleForm(true);
    setImageUploadError('');
    setVehicleForm({
      brand: vehicle.brand,
      model: vehicle.model,
      year: String(vehicle.year),
      price: String(vehicle.price),
      listingType: isRental(vehicle) ? 'rental' : 'sale',
      rentalAvailable: vehicle.rentalAvailable !== false,
      rentalTerms: vehicle.rentalTerms || '',
      mileage: String(vehicle.mileage),
      vatMode: vehicle.vatMode || 'inclusive',
      fuel: vehicle.fuel || '',
      bodyType: vehicle.bodyType || '',
      transmission: vehicle.transmission || '',
      engine: vehicle.engine || '',
      engineDisplacementCc: vehicle.engineDisplacementCc == null ? '' : String(vehicle.engineDisplacementCc),
      cylinders: vehicle.cylinders == null ? '' : String(vehicle.cylinders),
      power: vehicle.power || '',
      powerCv: vehicle.powerCv == null ? '' : String(vehicle.powerCv),
      powerKw: vehicle.powerKw == null ? '' : String(vehicle.powerKw),
      color: vehicle.color || '',
      drivetrain: vehicle.drivetrain || '',
      doors: vehicle.doors == null ? '' : String(vehicle.doors),
      seats: vehicle.seats == null ? '' : String(vehicle.seats),
      condition: vehicle.condition || '',
      previousOwners: vehicle.previousOwners == null ? '' : String(vehicle.previousOwners),
      warrantyMonths: vehicle.warrantyMonths == null ? '' : String(vehicle.warrantyMonths),
      maintenanceHistory: vehicle.maintenanceHistory || '',
      emissionsClass: vehicle.emissionsClass || '',
      consumptionCombined: vehicle.consumptionCombined == null ? '' : String(vehicle.consumptionCombined),
      consumptionUnit: vehicle.consumptionUnit || 'l/100 km',
      co2Emissions: vehicle.co2Emissions == null ? '' : String(vehicle.co2Emissions),
      torqueNm: vehicle.torqueNm == null ? '' : String(vehicle.torqueNm),
      accelerationSeconds: vehicle.accelerationSeconds == null ? '' : String(vehicle.accelerationSeconds),
      topSpeedKmh: vehicle.topSpeedKmh == null ? '' : String(vehicle.topSpeedKmh),
      trunkCapacityLitres: vehicle.trunkCapacityLitres == null ? '' : String(vehicle.trunkCapacityLitres),
      firstRegistration: vehicle.firstRegistration || '',
      inspectionYear: vehicle.inspectionYear == null ? '' : String(vehicle.inspectionYear),
      lastService: vehicle.lastService || '',
      noviceDriverEligible: vehicle.noviceDriverEligible || 'unknown',
      warrantyCoverage: Array.isArray(vehicle.warrantyCoverage) ? vehicle.warrantyCoverage : [],
      label: vehicle.label || '',
      installmentMonthlyAmount: vehicle.installmentPlan?.monthlyAmount == null ? '' : String(vehicle.installmentPlan.monthlyAmount),
      installmentMonths: vehicle.installmentPlan?.months == null ? '' : String(vehicle.installmentPlan.months),
      installmentTerms: vehicle.installmentPlan?.terms || '',
      additionalCosts: vehicle.additionalCosts || '',
      featuresText: Array.isArray(vehicle.features) ? vehicle.features.join('\n') : '',
      additionalImagesText: getVehicleImages(vehicle).slice(1).join('\n'),
      imageUrl: getVehicleImages(vehicle)[0] || vehicle.imageUrl || '',
      description: vehicle.description || '',
      isDemo: vehicle.isDemo === true,
    });
  };

  const updateVehicleField = (field, value) => {
    setVehicleForm((current) => ({ ...current, [field]: value }));
  };
  const setVehicleCover = (image) => {
    setVehicleForm((current) => {
      const images = [...new Set([current.imageUrl, ...current.additionalImagesText.split('\n')].map((item) => item.trim()).filter(Boolean))];
      const reordered = [image, ...images.filter((item) => item !== image)];
      return { ...current, imageUrl: reordered[0], additionalImagesText: reordered.slice(1).join('\n') };
    });
  };
  const removeVehicleImage = (image) => {
    setVehicleForm((current) => {
      const images = [...new Set([current.imageUrl, ...current.additionalImagesText.split('\n')].map((item) => item.trim()).filter(Boolean))].filter((item) => item !== image);
      return { ...current, imageUrl: images[0] || '', additionalImagesText: images.slice(1).join('\n') };
    });
  };

  const updateSiteSetting = (field, value) => {
    setSiteSettingsMessage('');
    setSiteSettingsForm((current) => ({ ...current, [field]: value }));
  };

  const saveSiteSettings = async (event) => {
    event.preventDefault();
    setAdminBusy(true);
    setAdminError('');
    setSiteSettingsMessage('');
    const publicAdmins = siteSettingsForm.publicAdminsText
      .split('\n')
      .map((name) => name.trim())
      .filter(Boolean);
    try {
      const result = await request('/api/admin/site-settings', {
        method: 'PUT',
        body: JSON.stringify({
          vatRate: Number(siteSettingsForm.vatRate),
          email: siteSettingsForm.email,
          phone: siteSettingsForm.phone,
          whatsapp: siteSettingsForm.whatsapp,
          logoUrl: siteSettingsForm.logoUrl,
          publicAdmins,
          contactsAreReal: siteSettingsForm.contactsAreReal,
          socialLinks: siteSettingsForm.socialLinks,
        }),
      });
      const settings = { ...defaultSiteSettings, ...result.settings };
      setSiteSettings(settings);
      setSiteSettingsForm(settingsFormFrom(settings));
      setSiteSettingsError('');
      setSiteSettingsMessage('Impostazioni salvate.');
    } catch (error) {
      setAdminError(error.message);
    } finally {
      setAdminBusy(false);
    }
  };

  const uploadSiteLogo = async (event) => {
    const input = event.currentTarget;
    const [file] = Array.from(input.files || []);
    input.value = '';
    if (!file) return;

    setLogoUploadError('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setLogoUploadError('Seleziona un logo JPEG, PNG o WebP.');
      return;
    }
    if (file.size === 0 || file.size > 5 * 1024 * 1024) {
      setLogoUploadError('Il logo deve pesare più di 0 e al massimo 5 MB.');
      return;
    }

    setLogoUploadBusy(true);
    try {
      const result = await request('/api/admin/site-logo', {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (typeof result.logoUrl !== 'string' || !result.logoUrl) {
        throw new Error('Il server non ha restituito il percorso del logo.');
      }
      updateSiteSetting('logoUrl', result.logoUrl);
      setLogoVisible(true);
    } catch (error) {
      setLogoUploadError(error.message);
    } finally {
      setLogoUploadBusy(false);
    }
  };

  const uploadVehicleImages = async (event) => {
    const input = event.currentTarget;
    const files = Array.from(input.files || []);
    input.value = '';
    if (files.length === 0) return;

    setImageUploadError('');
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const invalidFile = files.find((file) => !allowedTypes.includes(file.type));
    if (invalidFile) {
      setImageUploadError('Seleziona solo immagini JPEG, PNG o WebP.');
      return;
    }
    if (files.some((file) => file.size === 0 || file.size > 8 * 1024 * 1024)) {
      setImageUploadError('Ogni foto deve pesare più di 0 e al massimo 8 MB.');
      return;
    }

    const currentImages = vehicleFormImageUrls;
    if (currentImages.length + files.length > 8) {
      setImageUploadError('Puoi aggiungere al massimo 8 foto per auto.');
      return;
    }

    setImageUploadBusy(true);
    try {
      for (const file of files) {
        const result = await request('/api/admin/vehicle-images', {
          method: 'POST',
          headers: { 'Content-Type': file.type },
          body: file,
        });
        if (typeof result.imageUrl !== 'string' || !result.imageUrl) {
          throw new Error('Il server non ha restituito il percorso della foto caricata.');
        }
        setVehicleForm((current) => {
          const currentUrls = [...new Set([
            current.imageUrl,
            ...current.additionalImagesText.split('\n'),
            result.imageUrl,
          ].map((image) => image.trim()).filter(Boolean))];
          return {
            ...current,
            imageUrl: currentUrls[0] || '',
            additionalImagesText: currentUrls.slice(1).join('\n'),
          };
        });
      }
    } catch (error) {
      setImageUploadError(error.message);
    } finally {
      setImageUploadBusy(false);
    }
  };

  const deleteVehicle = async (id) => {
    setDeleteBusy(true);
    setDeleteError('');
    try {
      await request(`/api/admin/vehicles/${id}`, { method: 'DELETE' });
      setVehicleToDelete(null);
      if (editingId === id) {
        setEditingId('');
        setVehicleForm(emptyVehicle);
        setShowVehicleForm(false);
      }
      await Promise.all([loadAdminData(), loadVehicles()]);
    } catch (error) {
      setDeleteError(error.message);
    } finally {
      setDeleteBusy(false);
    }
  };

  const closeInquiry = async (id) => {
    setAdminError('');
    try {
      await request(`/api/admin/inquiries/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'handled' }),
      });
      await loadAdminData();
    } catch (error) {
      setAdminError(error.message);
    }
  };

  const logout = async () => {
    try {
      await request('/api/admin/logout', { method: 'POST' });
      setIsAdmin(false);
      setAdminVehicles([]);
      setInquiries([]);
      setAdminNeedsLoad(false);
    } catch (error) {
      setAdminError(error.message);
    }
  };

  return (
    <>
      <header className="site-header">
        <a className="brand" href="/" onClick={(event) => { event.preventDefault(); navigateHome(); }} aria-label="Peluso Group, home">
          {logoVisible ? (
            <img className="site-logo" src={siteSettings.logoUrl} alt="Peluso Group" onError={() => setLogoVisible(false)} />
          ) : (
            <>
              <span className="brand-mark">PG</span>
              <span className="brand-copy">
                <span>PELUSO<span className="brand-light">GROUP</span></span>
                <small>AUTOMOBILI SELEZIONATE</small>
              </span>
            </>
          )}
        </a>
        <nav aria-label="Navigazione principale">
          <a href="/#auto" onClick={(event) => { event.preventDefault(); navigateHome('auto'); }}>Auto</a>
          <a href="/#chi-siamo" onClick={(event) => { event.preventDefault(); navigateHome('chi-siamo'); }}>Chi siamo</a>
          <a href="/#contatti" onClick={(event) => { event.preventDefault(); navigateHome('contatti'); }}>Contatti</a>
        </nav>
        <button className="admin-link" onClick={openAdmin}>Area admin</button>
      </header>

      <main>
        {selectedVehicleId ? (
          selectedVehicle ? (
            <VehicleDetail
              vehicle={selectedVehicle}
              otherVehicles={vehicles}
              onBack={() => navigateHome('auto')}
              onContact={contactAboutVehicle}
              onOpen={openVehicle}
              vatRate={siteSettings.vatRate}
              siteSettings={siteSettings}
            />
          ) : pageError ? (
            <section className="not-found section-wrap">
              <p className="eyebrow">ERRORE DI CARICAMENTO</p>
              <h1>Non riusciamo a caricare l’auto.</h1>
              <p className="notice notice-error">{pageError}</p>
              <button className="button button-dark" onClick={loadVehicles}>Riprova</button>
            </section>
          ) : !vehiclesLoaded ? (
            <div className="page-status section-wrap">Caricamento scheda auto…</div>
          ) : (
            <section className="not-found section-wrap">
              <p className="eyebrow">ANNUNCIO NON DISPONIBILE</p>
              <h1>Non troviamo questa auto.</h1>
              <p>Potrebbe non essere più disponibile. Torna alla selezione per vedere le auto presenti.</p>
              <button className="button button-dark" onClick={() => navigateHome('auto')}>Torna alle auto</button>
            </section>
          )
        ) : (
          <>
            <section className="hero">
              <div className="hero-copy">
                <p className="eyebrow">PELUSO GROUP · AUTOMOBILI</p>
                <h1>La tua prossima auto,<br /><span>senza complicazioni.</span></h1>
                <p className="hero-text">Una selezione di auto, informazioni chiare e un team pronto ad aiutarti.</p>
                <button className="button button-dark" onClick={() => navigateHome('auto')}>Scopri le auto <span aria-hidden="true">↓</span></button>
              </div>
              <div className="hero-aside">
                <div className="hero-brand">
                  {logoVisible ? <img src={siteSettings.logoUrl} alt="" onError={() => setLogoVisible(false)} /> : <span>PELUSO GROUP</span>}
                </div>
                <div className="hero-caption">
                  <span>LA NOSTRA SELEZIONE</span>
                  {vehiclesLoaded && !pageError ? <strong>{String(vehicles.length).padStart(2, '0')} auto in selezione</strong> : <strong>Scopri la vetrina</strong>}
                </div>
              </div>
            </section>

            <section className="inventory section-wrap" id="auto">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">LA NOSTRA SELEZIONE</p>
                  <h2>Auto disponibili</h2>
                </div>
                <p>{vehicles.length} {vehicles.length === 1 ? 'auto selezionata' : 'auto selezionate'} · Informazioni chiare, senza fronzoli.</p>
              </div>
              <div className="catalog-filters" aria-label="Filtra catalogo">
                <label className="catalog-search">Cerca auto<input type="search" value={catalogFilters.search} onChange={(event) => setCatalogFilters((current) => ({ ...current, search: event.target.value }))} placeholder="Marca, modello o anno" /></label>
                <label>Tipo di annuncio<select value={catalogFilters.listingType} onChange={(event) => setCatalogFilters((current) => ({ ...current, listingType: event.target.value, maxPrice: '', sort: current.sort.startsWith('price-') ? 'newest' : current.sort }))}><option value="">Vendita e noleggio</option><option value="sale">Vendita</option><option value="rental">Noleggio</option></select></label>
                <label>Marca<select value={catalogFilters.brand} onChange={(event) => setCatalogFilters((current) => ({ ...current, brand: event.target.value }))}><option value="">Tutte</option>{catalogOptions.brand.map((value) => <option key={value}>{value}</option>)}</select></label>
                <label>Alimentazione<select value={catalogFilters.fuel} onChange={(event) => setCatalogFilters((current) => ({ ...current, fuel: event.target.value }))}><option value="">Tutte</option>{catalogOptions.fuel.map((value) => <option key={value}>{value}</option>)}</select></label>
                <label>Carrozzeria<select value={catalogFilters.bodyType} onChange={(event) => setCatalogFilters((current) => ({ ...current, bodyType: event.target.value }))}><option value="">Tutte</option>{catalogOptions.bodyType.map((value) => <option key={value}>{value}</option>)}</select></label>
                <label>Cambio<select value={catalogFilters.transmission} onChange={(event) => setCatalogFilters((current) => ({ ...current, transmission: event.target.value }))}><option value="">Tutti</option>{catalogOptions.transmission.map((value) => <option key={value}>{value}</option>)}</select></label>
                {priceFilterType ? <label>{priceFilterType === 'rental' ? 'Tariffa massima al giorno' : 'Budget massimo'}<input type="number" value={catalogFilters.maxPrice} onChange={(event) => setCatalogFilters((current) => ({ ...current, maxPrice: event.target.value }))} min="0" step="0.01" placeholder="€" /></label> : null}
                <label>Ordina<select value={catalogFilters.sort} onChange={(event) => setCatalogFilters((current) => ({ ...current, sort: event.target.value }))}><option value="newest">Più recenti</option>{priceFilterType ? <><option value="price-asc">Prezzo crescente</option><option value="price-desc">Prezzo decrescente</option></> : null}<option value="mileage">Minor chilometraggio</option><option value="year">Anno più recente</option></select></label>
              </div>
              <div className="catalog-results-bar">
                <span>{filteredVehicles.length} {filteredVehicles.length === 1 ? 'auto trovata' : 'auto trovate'}</span>
                <button type="button" className="text-link" onClick={() => setCatalogFilters({ search: '', listingType: '', brand: '', fuel: '', bodyType: '', transmission: '', maxPrice: '', sort: 'newest' })}>Azzera filtri</button>
              </div>
              {pageError ? <p className="notice notice-error">{pageError}</p> : null}
              {!pageError && vehiclesLoaded && vehicles.length === 0 ? (
                <div className="empty-state">Stiamo aggiornando la selezione. Contattaci per ricevere informazioni.</div>
              ) : null}
              {!vehiclesLoaded && !pageError ? <div className="empty-state">Caricamento auto…</div> : null}
              {vehiclesLoaded && !pageError && vehicles.length > 0 && filteredVehicles.length === 0 ? <div className="empty-state">Nessuna auto corrisponde ai filtri selezionati.</div> : null}
              <div className="vehicle-grid">{filteredVehicles.map((vehicle) => <VehicleCard key={vehicle._id} vehicle={vehicle} onOpen={openVehicle} vatRate={siteSettings.vatRate} />)}</div>
            </section>

            <section className="about" id="chi-siamo" aria-labelledby="about-title">
              <div className="about-intro">
                <p className="eyebrow">UN RAPPORTO DIRETTO</p>
                <h2 id="about-title">La scelta giusta parte da una conversazione.</h2>
                <p>In Peluso Group vogliamo rendere la ricerca della tua prossima auto più semplice, con informazioni chiare e un rapporto diretto.</p>
                <button className="button button-dark" onClick={() => navigateHome('contatti')}>Parliamone <span aria-hidden="true">→</span></button>
              </div>
              <div className="about-values">
                <article><span>01</span><div><h3>Una selezione da scoprire</h3><p>Esplora le auto in vetrina e consulta le informazioni disponibili su ogni scheda.</p></div></article>
                <article><span>02</span><div><h3>Informazioni chiare</h3><p>Hai una domanda su un annuncio? Scrivici per approfondire i dettagli che ti interessano.</p></div></article>
                <article><span>03</span><div><h3>Un contatto diretto</h3><p>Raccontaci cosa cerchi: il nostro team è a disposizione per aiutarti nella scelta.</p></div></article>
                <article className="about-address"><span>04</span><div><h3>Vieni in concessionaria</h3><p><a href={dealership.mapUrl} target="_blank" rel="noreferrer">{dealership.address} ↗</a></p></div></article>
              </div>
            </section>

            <section className="contact section-wrap" id="contatti" aria-labelledby="contact-title">
              <div className="contact-intro">
                <p className="eyebrow">SIAMO A TUA DISPOSIZIONE</p>
                <h2 id="contact-title">Parliamo della tua prossima auto.</h2>
                <p>Hai visto un’auto o vuoi maggiori informazioni? Scrivici: il tuo messaggio arriverà al nostro team.</p>
                {siteSettings.contactsAreReal && (siteSettings.email || siteSettings.phone || siteSettings.whatsapp) ? (
                  <div className="contact-channels">
                    <h3>Preferisci contattarci direttamente?</h3>
                    {siteSettings.email ? <a href={`mailto:${siteSettings.email}`}><span>Email</span><strong>{siteSettings.email}</strong><span aria-hidden="true">↗</span></a> : null}
                    {siteSettings.phone ? <a href={`tel:${siteSettings.phone.replace(/[^\d+]/g, '')}`}><span>Telefono</span><strong>{siteSettings.phone}</strong><span aria-hidden="true">↗</span></a> : null}
                    {siteSettings.whatsapp ? <a href={`https://wa.me/${siteSettings.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"><span>WhatsApp</span><strong>{siteSettings.whatsapp}</strong><span aria-hidden="true">↗</span></a> : null}
                  </div>
                ) : <p className="contact-form-note">Usa il modulo per metterti in contatto con noi.</p>}
                {Object.values(siteSettings.socialLinks || {}).some(Boolean) ? (
                  <div className="social-contact-links">
                    <span>Seguici</span>
                    {[
                      ['facebook', 'Facebook'],
                      ['instagram', 'Instagram'],
                      ['tiktok', 'TikTok'],
                      ['youtube', 'YouTube'],
                    ].filter(([key]) => siteSettings.socialLinks?.[key]).map(([key, label]) => (
                      <a key={key} href={siteSettings.socialLinks[key]} target="_blank" rel="noreferrer">{label} ↗</a>
                    ))}
                  </div>
                ) : null}
                <a className="dealership-address" href={dealership.mapUrl} target="_blank" rel="noreferrer">
                  <span>Ci trovi qui</span>
                  <strong>{dealership.address}</strong>
                  <span aria-hidden="true">↗</span>
                </a>
                <div className="opening-hours">
                  <h3>Orari di apertura</h3>
                  <dl>
                    {dealership.openingHours.map(([day, morning, afternoon]) => (
                      <div key={day}>
                        <dt>{day}</dt>
                        <dd><span>{morning}</span>{afternoon ? <span className={afternoon.includes('chiuso') ? 'closed-hours' : ''}>{afternoon}</span> : null}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
              <form className="contact-form" onSubmit={submitContact}>
                <div className="contact-form-heading"><p className="eyebrow">SCRIVICI</p><h3>Inviaci un messaggio</h3><p>Compila i campi e raccontaci come possiamo aiutarti.</p></div>
                {contactVehicle ? <div className="contact-vehicle">Annuncio: <strong>{contactVehicle.brand} {contactVehicle.model} ({contactVehicle.year})</strong><button type="button" className="text-link" onClick={() => setContactVehicle(null)}>Rimuovi riferimento</button></div> : null}
                <label>Nome<input name="name" autoComplete="name" minLength="2" maxLength="80" required /></label>
                <div className="form-row">
                  <label>Email<input name="email" type="email" autoComplete="email" maxLength="254" required /></label>
                  <label>Telefono <span className="optional">(facoltativo)</span><input name="phone" type="tel" autoComplete="tel" maxLength="40" /></label>
                </div>
                <label>Messaggio<textarea name="message" rows="4" minLength="10" maxLength="2000" value={contactText} onChange={(event) => setContactText(event.target.value)} required /></label>
                <button className="button button-dark" disabled={contactBusy}>
                  {contactBusy ? 'Invio in corso…' : 'Invia messaggio'}
                </button>
              </form>
            </section>
          </>
        )}
      </main>

      <footer className="site-footer">
        <div className="footer-main">
          <div className="footer-brand-block">
            <a className="brand brand-footer" href="/" onClick={(event) => { event.preventDefault(); navigateHome(); }}>
              {logoVisible ? (
                <img className="site-logo" src={siteSettings.logoUrl} alt="Peluso Group" onError={() => setLogoVisible(false)} />
              ) : (
                <>
                  <span className="brand-mark">PG</span>
                  <span className="brand-copy">
                    <span>PELUSO<span className="brand-light">GROUP</span></span>
                    <small>AUTOMOBILI SELEZIONATE</small>
                  </span>
                </>
              )}
            </a>
            <p>Una selezione curata e un rapporto diretto, per aiutarti a scegliere con tranquillità.</p>
            <p className="footer-legal">Partita IVA {dealership.vatNumber}</p>
          </div>
          <nav className="footer-links" aria-label="Link nel piè di pagina">
            <a href="/#auto" onClick={(event) => { event.preventDefault(); navigateHome('auto'); }}>Auto</a>
            <a href="/#chi-siamo" onClick={(event) => { event.preventDefault(); navigateHome('chi-siamo'); }}>Chi siamo</a>
            <a href="/#contatti" onClick={(event) => { event.preventDefault(); navigateHome('contatti'); }}>Contatti</a>
          </nav>
          <div className="footer-contact">
            <strong>Contatti e referenti</strong>
            {siteSettings.email ? (
              <p><span>Email</span>
                {siteSettings.contactsAreReal
                  ? <a href={`mailto:${siteSettings.email}`}>{siteSettings.email}</a>
                  : <span className="provisional-contact">{siteSettings.email}</span>}
              </p>
            ) : null}
            {siteSettings.phone ? (
              <p><span>Telefono</span>
                {siteSettings.contactsAreReal
                  ? <a href={`tel:${siteSettings.phone.replace(/[^\d+]/g, '')}`}>{siteSettings.phone}</a>
                  : <span className="provisional-contact">{siteSettings.phone}</span>}
              </p>
            ) : null}
            {siteSettings.whatsapp ? (
              <p><span>WhatsApp</span>
                {siteSettings.contactsAreReal
                  ? <a href={`https://wa.me/${siteSettings.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">{siteSettings.whatsapp}</a>
                  : <span className="provisional-contact">{siteSettings.whatsapp}</span>}
              </p>
            ) : null}
            {!siteSettings.contactsAreReal ? <span className="provisional-note">Recapiti di esempio · da aggiornare</span> : null}
            {siteSettings.publicAdmins.length ? (
              <div className="footer-admins">
                <span>Referenti</span>
                <ul>{siteSettings.publicAdmins.map((name) => <li key={name}>{name}</li>)}</ul>
              </div>
            ) : null}
            <button className="text-link" onClick={() => navigateHome('contatti')}>Scrivici <span aria-hidden="true">→</span></button>
            {Object.values(siteSettings.socialLinks || {}).some(Boolean) ? (
              <div className="footer-socials">
                {[
                  ['facebook', 'Facebook'],
                  ['instagram', 'Instagram'],
                  ['tiktok', 'TikTok'],
                  ['youtube', 'YouTube'],
                ].filter(([key]) => siteSettings.socialLinks?.[key]).map(([key, label]) => (
                  <a key={key} href={siteSettings.socialLinks[key]} target="_blank" rel="noreferrer" aria-label={`Seguici su ${label}`}>{label}</a>
                ))}
              </div>
            ) : null}
            <a className="footer-address" href={dealership.mapUrl} target="_blank" rel="noreferrer">{dealership.address} ↗</a>
            {siteSettingsError ? <span className="provisional-note">{siteSettingsError}</span> : null}
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Peluso Group</span>
          <span>PELUSO GROUP · AUTOMOBILI · P.IVA {dealership.vatNumber}</span>
        </div>
      </footer>

      {adminOpen ? (
        <div className="modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setAdminOpen(false);
        }}>
          <section className={`admin-modal ${isAdmin ? '' : 'is-login'}`} role="dialog" aria-modal="true" aria-labelledby="admin-title">
            <div className="admin-heading">
              <div>
                <p className="eyebrow">PELUSO GROUP · GESTIONE</p>
                <h2 id="admin-title">{isAdmin ? 'Pannello di controllo' : 'Area admin'}</h2>
              </div>
              <button className="icon-button" aria-label="Chiudi" onClick={() => setAdminOpen(false)}>×</button>
            </div>
            {adminError && (!isAdmin || adminTab !== 'settings') ? <p className="notice notice-error" role="alert">{adminError}</p> : null}
            {!isAdmin ? (
              <div className="admin-login-panel">
                <p>Accedi per gestire le auto in vetrina e rispondere ai messaggi dei clienti.</p>
                <form className="admin-login" onSubmit={submitLogin}>
                  <label>Nome utente<input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required /></label>
                  <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></label>
                  <button className="button button-dark" disabled={adminBusy}>{adminBusy ? 'Accesso…' : 'Accedi al pannello'}</button>
                </form>
              </div>
            ) : (
              <>
                <div className="admin-welcome">
                  <div>
                    <p className="admin-greeting">Bentornato{username ? `, ${username}` : ''}</p>
                    <p>Qui puoi aggiornare la selezione e tenere sotto controllo le richieste.</p>
                  </div>
                  <button className="button button-light" onClick={logout}>Esci dall’area admin</button>
                </div>

                <div className="admin-summary">
                  <article><span>Auto in vetrina</span><strong>{adminVehicles.length}</strong></article>
                  <article><span>Schede dimostrative</span><strong>{adminVehicles.filter((vehicle) => vehicle.isDemo).length}</strong></article>
                  <article><span>Messaggi da leggere</span><strong>{inquiries.filter((item) => item.status === 'open').length}</strong></article>
                </div>

                <div className="admin-tabs" role="tablist" aria-label="Sezioni admin">
                  <button type="button" className={adminTab === 'vehicles' ? 'active' : ''} onClick={() => setAdminTab('vehicles')} role="tab" aria-selected={adminTab === 'vehicles'}>Inventario <span>{adminVehicles.length}</span></button>
                  <button type="button" className={adminTab === 'inquiries' ? 'active' : ''} onClick={() => setAdminTab('inquiries')} role="tab" aria-selected={adminTab === 'inquiries'}>Messaggi <span>{inquiries.filter((item) => item.status === 'open').length}</span></button>
                  <button type="button" className={adminTab === 'settings' ? 'active' : ''} onClick={() => setAdminTab('settings')} role="tab" aria-selected={adminTab === 'settings'}>Impostazioni</button>
                </div>

                {adminBusy ? <p className="admin-loading" role="status">Aggiornamento dati…</p> : null}
                {adminTab === 'vehicles' ? (
                  <section className="admin-section" role="tabpanel">
                    <div className="admin-toolbar">
                      <div>
                        <h3>Inventario auto</h3>
                        <p>Gestisci prezzi, foto e informazioni visibili nella vetrina.</p>
                      </div>
                      <button className="button button-dark" onClick={() => {
                        if (imageUploadBusy) return;
                        if (showVehicleForm && !editingId) {
                          setShowVehicleForm(false);
                          return;
                        }
                        setEditingId('');
                        setVehicleForm(emptyVehicle);
                        setImageUploadError('');
                        setShowVehicleForm(true);
                      }} disabled={imageUploadBusy}>
                        {showVehicleForm && !editingId ? 'Chiudi modulo' : '+ Aggiungi auto'}
                      </button>
                    </div>

                    {showVehicleForm ? (
                      <form className="vehicle-form" onSubmit={saveVehicle}>
                        <div className="vehicle-form-heading">
                          <div>
                            <p className="eyebrow">{editingId ? 'AGGIORNA ANNUNCIO' : 'NUOVO ANNUNCIO'}</p>
                            <h3>{editingId ? 'Modifica auto' : 'Inserisci un’auto'}</h3>
                          </div>
                          <button className="icon-button" type="button" aria-label="Chiudi modulo auto" disabled={imageUploadBusy} onClick={() => {
                            setShowVehicleForm(false);
                            setEditingId('');
                            setVehicleForm(emptyVehicle);
                            setImageUploadError('');
                          }}>×</button>
                        </div>

                        <div className="vehicle-form-section">
                          <h4>Dati principali</h4>
                          <label>Tipo di annuncio<select value={vehicleForm.listingType} onChange={(event) => setVehicleForm((current) => ({ ...current, listingType: event.target.value, price: '' }))}><option value="sale">Vendita</option><option value="rental">Noleggio</option></select></label>
                          <p className="form-help">Se cambi il tipo di annuncio, inserisci nuovamente il prezzo o la tariffa.</p>
                          {!rentalSupported && vehicleForm.listingType === 'rental' ? <p className="notice notice-error" role="alert">Riavvia il backend aggiornato per abilitare il noleggio.</p> : null}
                          <div className="admin-form-grid admin-form-grid-two">
                            <label>Marca<input value={vehicleForm.brand} onChange={(event) => updateVehicleField('brand', event.target.value)} maxLength="50" required /></label>
                            <label>Modello<input value={vehicleForm.model} onChange={(event) => updateVehicleField('model', event.target.value)} maxLength="80" required /></label>
                          </div>
                          <div className="admin-form-grid admin-form-grid-three">
                            <label>Anno<input type="number" value={vehicleForm.year} onChange={(event) => updateVehicleField('year', event.target.value)} min="1886" max={new Date().getFullYear() + 1} required /></label>
                            <label>{vehicleForm.listingType === 'rental' ? 'Tariffa giornaliera (€)' : 'Prezzo (€)'}<input type="number" value={vehicleForm.price} onChange={(event) => updateVehicleField('price', event.target.value)} min={vehicleForm.listingType === 'rental' ? '0.01' : '0'} step={vehicleForm.listingType === 'rental' ? '0.01' : '1'} required /></label>
                            <label>Chilometraggio<input type="number" value={vehicleForm.mileage} onChange={(event) => updateVehicleField('mileage', event.target.value)} min="0" step="1" required /></label>
                          </div>
                          <div className="admin-form-grid admin-form-grid-two">
                            <label>Trattamento IVA<select value={vehicleForm.vatMode} onChange={(event) => updateVehicleField('vatMode', event.target.value)}><option value="inclusive">IVA inclusa</option><option value="exclusive">IVA esclusa</option><option value="not-applied">IVA non applicata</option></select></label>
                            <VehicleSelect label="Condizione" field="condition" value={vehicleForm.condition} options={vehicleSelectOptions.condition} onChange={updateVehicleField} />
                          </div>
                          <label>Costi aggiuntivi <span className="optional">(facoltativo, solo se verificati)</span><textarea rows="2" value={vehicleForm.additionalCosts} onChange={(event) => updateVehicleField('additionalCosts', event.target.value)} maxLength="500" placeholder={vehicleForm.listingType === 'rental' ? 'Es. costi di consegna' : 'Es. passaggio di proprietà'} /></label>
                          {vehicleForm.listingType === 'rental' ? <>
                            <label className="demo-checkbox"><input type="checkbox" checked={vehicleForm.rentalAvailable} onChange={(event) => updateVehicleField('rentalAvailable', event.target.checked)} /> Accetta richieste di noleggio</label>
                            <label>Condizioni del noleggio <span className="optional">(facoltativo)</span><textarea rows="3" value={vehicleForm.rentalTerms} onChange={(event) => updateVehicleField('rentalTerms', event.target.value)} maxLength="1000" placeholder="Es. chilometri inclusi, deposito, assicurazione e requisiti del conducente" /></label>
                            <p className="form-help">Le richieste non bloccano le date: disponibilità e condizioni devono essere confermate manualmente.</p>
                          </> : null}
                        </div>

                        <div className="vehicle-form-section">
                          <h4>Dettagli tecnici <span>(facoltativi, mostra solo i dati verificati)</span></h4>
                          <div className="admin-form-grid admin-form-grid-three">
                            <VehicleSelect label="Alimentazione" field="fuel" value={vehicleForm.fuel} options={vehicleSelectOptions.fuel} onChange={updateVehicleField} />
                            <VehicleSelect label="Carrozzeria" field="bodyType" value={vehicleForm.bodyType} options={vehicleSelectOptions.bodyType} onChange={updateVehicleField} />
                            <VehicleSelect label="Cambio" field="transmission" value={vehicleForm.transmission} options={vehicleSelectOptions.transmission} onChange={updateVehicleField} />
                            <label>Motore<input value={vehicleForm.engine} onChange={(event) => updateVehicleField('engine', event.target.value)} maxLength="100" placeholder="Descrizione motore" /></label>
                            <label>Cilindrata (cm³)<input type="number" value={vehicleForm.engineDisplacementCc} onChange={(event) => updateVehicleField('engineDisplacementCc', event.target.value)} min="500" max="20000" step="1" /></label>
                            <label>Cilindri<input type="number" value={vehicleForm.cylinders} onChange={(event) => updateVehicleField('cylinders', event.target.value)} min="1" max="16" step="1" /></label>
                            <label>Potenza (testo)<input value={vehicleForm.power} onChange={(event) => updateVehicleField('power', event.target.value)} maxLength="50" placeholder="Es. 150 CV / 110 kW" /></label>
                            <label>Potenza (CV)<input type="number" value={vehicleForm.powerCv} onChange={(event) => updateVehicleField('powerCv', event.target.value)} min="1" max="3000" step="1" /></label>
                            <label>Potenza (kW)<input type="number" value={vehicleForm.powerKw} onChange={(event) => updateVehicleField('powerKw', event.target.value)} min="0.1" max="2000" step="0.1" /></label>
                            <label>Colore<input value={vehicleForm.color} onChange={(event) => updateVehicleField('color', event.target.value)} maxLength="40" /></label>
                            <VehicleSelect label="Trazione" field="drivetrain" value={vehicleForm.drivetrain} options={vehicleSelectOptions.drivetrain} onChange={updateVehicleField} />
                            <VehicleSelect label="Classe emissioni" field="emissionsClass" value={vehicleForm.emissionsClass} options={vehicleSelectOptions.emissionsClass} onChange={updateVehicleField} />
                            <label>Porte<input type="number" value={vehicleForm.doors} onChange={(event) => updateVehicleField('doors', event.target.value)} min="1" max="8" step="1" /></label>
                            <label>Posti<input type="number" value={vehicleForm.seats} onChange={(event) => updateVehicleField('seats', event.target.value)} min="1" max="20" step="1" /></label>
                            <label>Proprietari precedenti<input type="number" value={vehicleForm.previousOwners} onChange={(event) => updateVehicleField('previousOwners', event.target.value)} min="0" max="50" step="1" /></label>
                            <label>Consumo combinato<input type="number" value={vehicleForm.consumptionCombined} onChange={(event) => updateVehicleField('consumptionCombined', event.target.value)} min="0.1" max="100" step="0.1" /></label>
                            <label>Unità di consumo<select value={vehicleForm.consumptionUnit} onChange={(event) => updateVehicleField('consumptionUnit', event.target.value)}><option value="l/100 km">l/100 km</option><option value="kWh/100 km">kWh/100 km</option></select></label>
                            <label>Emissioni CO₂ (g/km)<input type="number" value={vehicleForm.co2Emissions} onChange={(event) => updateVehicleField('co2Emissions', event.target.value)} min="0" max="2000" step="1" /></label>
                            <label>Coppia (Nm)<input type="number" value={vehicleForm.torqueNm} onChange={(event) => updateVehicleField('torqueNm', event.target.value)} min="1" max="10000" step="1" /></label>
                            <label>0–100 km/h (secondi)<input type="number" value={vehicleForm.accelerationSeconds} onChange={(event) => updateVehicleField('accelerationSeconds', event.target.value)} min="0.1" max="120" step="0.1" /></label>
                            <label>Velocità massima (km/h)<input type="number" value={vehicleForm.topSpeedKmh} onChange={(event) => updateVehicleField('topSpeedKmh', event.target.value)} min="1" max="600" step="1" /></label>
                            <label>Capacità bagagliaio (litri)<input type="number" value={vehicleForm.trunkCapacityLitres} onChange={(event) => updateVehicleField('trunkCapacityLitres', event.target.value)} min="0" max="10000" step="1" /></label>
                            <label>Prima immatricolazione<input value={vehicleForm.firstRegistration} onChange={(event) => updateVehicleField('firstRegistration', event.target.value)} maxLength="20" placeholder="MM/AAAA" /></label>
                            <label>Anno revisione<input type="number" value={vehicleForm.inspectionYear} onChange={(event) => updateVehicleField('inspectionYear', event.target.value)} min="1950" max={new Date().getFullYear() + 10} step="1" /></label>
                            <label>Ultimo tagliando<input value={vehicleForm.lastService} onChange={(event) => updateVehicleField('lastService', event.target.value)} maxLength="80" placeholder="Data o chilometraggio" /></label>
                            <label>Garanzia (mesi)<input type="number" value={vehicleForm.warrantyMonths} onChange={(event) => updateVehicleField('warrantyMonths', event.target.value)} min="0" max="120" step="1" /></label>
                            <label>Idoneità neopatentati<select value={vehicleForm.noviceDriverEligible} onChange={(event) => updateVehicleField('noviceDriverEligible', event.target.value)}><option value="unknown">Non specificata</option><option value="yes">Sì</option><option value="no">No</option></select></label>
                            <label>Categoria / etichetta<input value={vehicleForm.label} onChange={(event) => updateVehicleField('label', event.target.value)} maxLength="50" placeholder="Es. versione o allestimento" /></label>
                          </div>
                          <fieldset className="warranty-coverage">
                            <legend>Componenti coperti dalla garanzia <span className="optional">(facoltativo)</span></legend>
                            <div className="coverage-options">
                              {warrantyCoverageOptions.map(([value, label]) => (
                                <label className="coverage-option" key={value}>
                                  <input
                                    type="checkbox"
                                    checked={vehicleForm.warrantyCoverage.includes(value)}
                                    onChange={(event) => {
                                      const selected = vehicleForm.warrantyCoverage;
                                      updateVehicleField('warrantyCoverage', event.target.checked
                                        ? [...selected, value]
                                        : selected.filter((item) => item !== value));
                                    }}
                                  />
                                  {label}
                                </label>
                              ))}
                            </div>
                          </fieldset>
                        </div>

                        {vehicleForm.listingType === 'sale' ? <div className="vehicle-form-section">
                          <h4>Piano rateale <span>(facoltativo)</span></h4>
                          <div className="admin-form-grid admin-form-grid-two">
                            <label>Rata mensile (€)<input type="number" value={vehicleForm.installmentMonthlyAmount} onChange={(event) => updateVehicleField('installmentMonthlyAmount', event.target.value)} min="0.01" max="100000000" step="0.01" /></label>
                            <label>Durata (mesi)<input type="number" value={vehicleForm.installmentMonths} onChange={(event) => updateVehicleField('installmentMonths', event.target.value)} min="2" max="120" step="1" /></label>
                          </div>
                          <p className="form-help">Inserisci entrambi i valori solo se il piano è effettivamente disponibile.</p>
                          <label>Condizioni del piano <span className="optional">(facoltativo, solo informazioni verificate)</span><textarea rows="3" value={vehicleForm.installmentTerms} onChange={(event) => updateVehicleField('installmentTerms', event.target.value)} maxLength="1000" placeholder="Eventuali anticipo, TAN, TAEG, spese e condizioni" /></label>
                        </div> : null}

                        <div className="vehicle-form-section">
                          <h4>Descrizione e foto</h4>
                          <label>URL foto principale<input type="text" value={vehicleForm.imageUrl} onChange={(event) => updateVehicleField('imageUrl', event.target.value)} maxLength="500" placeholder="URL HTTPS o foto importata" /></label>
                          <label className="image-upload-label">Carica dal computer <span className="optional">JPEG, PNG o WebP · massimo 8 MB per foto, 8 foto totali</span><input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={uploadVehicleImages} disabled={adminBusy || imageUploadBusy} /></label>
                          {imageUploadBusy ? <p className="admin-loading" role="status">Caricamento foto…</p> : null}
                          {imageUploadError ? <p className="notice notice-error">{imageUploadError}</p> : null}
                          {vehicleFormImageUrls.length ? (
                            <div className="admin-image-previews" aria-label="Anteprima foto selezionate">
                              {vehicleFormImageUrls.map((image, index) => (
                                <div className={`admin-image-choice ${image === vehicleForm.imageUrl ? 'is-cover' : ''}`} key={`${image}-${index}`}>
                                  <button type="button" className="admin-image-choice-main" onClick={() => setVehicleCover(image)} aria-label={`Imposta foto ${index + 1} come copertina`}>
                                    <img className="admin-image-preview" src={image} alt={`Anteprima foto ${index + 1}`} />
                                    <span>{image === vehicleForm.imageUrl ? 'Copertina' : 'Usa come copertina'}</span>
                                  </button>
                                  <button type="button" className="admin-image-remove" onClick={() => removeVehicleImage(image)} aria-label={`Rimuovi foto ${index + 1}`}>×</button>
                                </div>
                              ))}
                            </div>
                          ) : null}
                          <label>Altre foto <span className="optional">(una URL o percorso per riga, massimo 7)</span><textarea rows="3" value={vehicleForm.additionalImagesText} onChange={(event) => updateVehicleField('additionalImagesText', event.target.value)} maxLength="3500" placeholder="URL HTTPS o foto caricate dal computer" /></label>
                          <label>Descrizione<textarea rows="4" value={vehicleForm.description} onChange={(event) => updateVehicleField('description', event.target.value)} maxLength="1000" placeholder="Descrivi l’auto con informazioni accurate." /></label>
                          <label>Storico manutenzione<textarea rows="3" value={vehicleForm.maintenanceHistory} onChange={(event) => updateVehicleField('maintenanceHistory', event.target.value)} maxLength="1000" placeholder="Inserisci solo informazioni documentate." /></label>
                          <label>Dotazioni <span className="optional">(una per riga, massimo 20)</span><textarea rows="4" value={vehicleForm.featuresText} onChange={(event) => updateVehicleField('featuresText', event.target.value)} maxLength="2000" placeholder={'Navigatore\nSensori di parcheggio'} /></label>
                        </div>

                        <label className="demo-checkbox"><input type="checkbox" checked={vehicleForm.isDemo} onChange={(event) => updateVehicleField('isDemo', event.target.checked)} /> Scheda dimostrativa: i dati non sono reali</label>
                        <div className="form-actions">
                          <button className="button button-dark" disabled={adminBusy || imageUploadBusy}>{adminBusy ? 'Salvataggio…' : editingId ? 'Salva modifiche' : 'Pubblica auto'}</button>
                          <button className="button button-light" type="button" disabled={imageUploadBusy} onClick={() => {
                            setShowVehicleForm(false);
                            setEditingId('');
                            setVehicleForm(emptyVehicle);
                            setImageUploadError('');
                          }}>Annulla</button>
                        </div>
                      </form>
                    ) : null}

                    <div className="admin-list-toolbar">
                      <label className="admin-search">Cerca nell’inventario<input type="search" value={adminVehicleQuery} onChange={(event) => setAdminVehicleQuery(event.target.value)} placeholder="Marca, modello o anno" /></label>
                      <span>{filteredAdminVehicles.length} {filteredAdminVehicles.length === 1 ? 'risultato' : 'risultati'}</span>
                    </div>
                    {filteredAdminVehicles.length ? (
                      <div className="admin-list">
                        {filteredAdminVehicles.map((vehicle) => (
                          <article className="admin-list-item" key={vehicle._id}>
                            {vehicle.imageUrl ? <img src={vehicle.imageUrl} alt="" loading="lazy" /> : <div className="admin-image-placeholder">PG</div>}
                            <div className="admin-vehicle-info">
                              <strong>{vehicle.brand} {vehicle.model}</strong>
                              <span>{vehicle.year} · {mileage(vehicle.mileage)} · {listingPrice(vehicle)}</span>
                              <div className="admin-vehicle-tags">
                                <span className="admin-tag">{isRental(vehicle) ? (vehicle.rentalAvailable === false ? 'NOLEGGIO · RICHIESTE SOSPESE' : 'NOLEGGIO') : 'VENDITA'}</span>
                                {vehicle.isDemo ? <span className="admin-tag demo-tag">DEMO</span> : null}
                                <span className="admin-tag">{vehicle.transmission || vehicle.fuel || 'Dettagli da completare'}</span>
                              </div>
                            </div>
                            <div className="admin-item-actions">
                              <button onClick={() => editVehicle(vehicle)}>Modifica</button>
                              <button className="danger-link" onClick={() => { setDeleteError(''); setVehicleToDelete(vehicle); }}>Elimina</button>
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-state">{adminVehicleQuery ? 'Nessuna auto corrisponde alla ricerca.' : 'Non ci sono auto in inventario. Aggiungi la prima auto.'}</div>
                    )}
                  </section>
                ) : adminTab === 'inquiries' ? (
                  <section className="admin-section" role="tabpanel">
                    <div className="admin-toolbar">
                      <div>
                        <h3>Messaggi dei clienti</h3>
                        <p>Leggi le richieste e tieni traccia di quelle già gestite.</p>
                      </div>
                    </div>
                    <div className="inquiry-toolbar">
                      <div className="inquiry-filters" aria-label="Filtra messaggi">
                        {[
                          ['open', 'Da gestire'],
                          ['handled', 'Gestiti'],
                          ['all', 'Tutti'],
                        ].map(([filter, label]) => (
                          <button type="button" className={inquiryFilter === filter ? 'active' : ''} key={filter} onClick={() => setInquiryFilter(filter)}>
                            {label}{filter === 'open' ? ` (${inquiries.filter((item) => item.status === 'open').length})` : ''}
                          </button>
                        ))}
                      </div>
                      <label className="admin-search">Cerca messaggi<input type="search" value={inquiryQuery} onChange={(event) => setInquiryQuery(event.target.value)} placeholder="Nome, email o testo" /></label>
                    </div>
                    {filteredInquiries.length ? (
                      <div className="inquiry-list">
                        {filteredInquiries.map((inquiry) => (
                          <article className={`inquiry-card ${inquiry.status === 'handled' ? 'is-handled' : ''}`} key={inquiry._id}>
                            <div className="inquiry-top">
                              <div><strong>{inquiry.name}</strong><time>{new Date(inquiry.createdAt).toLocaleString('it-IT')}</time></div>
                              <span className={`inquiry-status ${inquiry.status === 'open' ? 'status-open' : 'status-handled'}`}>{inquiry.status === 'open' ? 'Da gestire' : 'Gestito'}</span>
                            </div>
                            <div className="inquiry-contact-links">
                              <a href={`mailto:${inquiry.email}`}>{inquiry.email}</a>
                              {inquiry.phone ? <a href={`tel:${inquiry.phone}`}>{inquiry.phone}</a> : null}
                            </div>
                            <p className="inquiry-message">{inquiry.message}</p>
                            {inquiry.inquiryType === 'rental' ? <p className="inquiry-vehicle"><strong>Richiesta noleggio (da confermare)</strong> · Ritiro: {inquiry.rentalStart} · Riconsegna: {inquiry.rentalEnd}</p> : null}
                            {inquiry.vehicleId ? <p className="inquiry-vehicle">Annuncio: <a href={`/auto/${encodeURIComponent(inquiry.vehicleId)}`} target="_blank" rel="noreferrer">{inquiry.vehicleLabel || 'Apri annuncio'} ↗</a></p> : null}
                            {inquiry.status === 'open' ? <button className="button button-light" onClick={() => closeInquiry(inquiry._id)}>Segna come gestito</button> : null}
                          </article>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-state">{inquiryQuery ? 'Nessun messaggio corrisponde alla ricerca.' : inquiryFilter === 'open' ? 'Non ci sono nuove richieste da gestire.' : 'Non ci sono messaggi in questa sezione.'}</div>
                    )}
                  </section>
                ) : (
                  <section className="admin-section" role="tabpanel">
                    <div className="admin-toolbar">
                      <div>
                        <h3>Impostazioni del sito</h3>
                        <p>Configura IVA, recapiti, logo e nomi pubblici dei referenti.</p>
                      </div>
                    </div>
                    {siteSettingsError ? <p className="notice notice-error" role="alert">{siteSettingsError}</p> : null}
                    <form className="site-settings-form" onSubmit={saveSiteSettings}>
                      <section className="vehicle-form-section">
                        <h4>IVA</h4>
                        <div className="admin-form-grid admin-form-grid-two">
                          <label>Aliquota IVA (%)<input type="number" value={siteSettingsForm.vatRate} onChange={(event) => updateSiteSetting('vatRate', event.target.value)} min="0" max="100" step="0.01" required /></label>
                        </div>
                        <p className="form-help">La percentuale viene mostrata sugli annunci impostati come “IVA esclusa”.</p>
                      </section>

                      <section className="vehicle-form-section">
                        <h4>Social</h4>
                        <div className="admin-form-grid admin-form-grid-two">
                          <label>Facebook<input type="url" value={siteSettingsForm.socialLinks.facebook} onChange={(event) => updateSiteSetting('socialLinks', { ...siteSettingsForm.socialLinks, facebook: event.target.value })} maxLength="500" placeholder="https://facebook.com/..." /></label>
                          <label>Instagram<input type="url" value={siteSettingsForm.socialLinks.instagram} onChange={(event) => updateSiteSetting('socialLinks', { ...siteSettingsForm.socialLinks, instagram: event.target.value })} maxLength="500" placeholder="https://instagram.com/..." /></label>
                          <label>TikTok<input type="url" value={siteSettingsForm.socialLinks.tiktok} onChange={(event) => updateSiteSetting('socialLinks', { ...siteSettingsForm.socialLinks, tiktok: event.target.value })} maxLength="500" placeholder="https://tiktok.com/@..." /></label>
                          <label>YouTube<input type="url" value={siteSettingsForm.socialLinks.youtube} onChange={(event) => updateSiteSetting('socialLinks', { ...siteSettingsForm.socialLinks, youtube: event.target.value })} maxLength="500" placeholder="https://youtube.com/..." /></label>
                        </div>
                        <p className="form-help">Inserisci URL HTTPS. I social non configurati non vengono mostrati sul sito.</p>
                      </section>

                      <section className="vehicle-form-section">
                        <h4>Recapiti pubblici</h4>
                        <div className="admin-form-grid admin-form-grid-three">
                          <label>Email<input type="email" value={siteSettingsForm.email} onChange={(event) => updateSiteSetting('email', event.target.value)} maxLength="254" /></label>
                          <label>Telefono<input type="tel" value={siteSettingsForm.phone} onChange={(event) => updateSiteSetting('phone', event.target.value)} maxLength="40" /></label>
                          <label>WhatsApp<input type="tel" value={siteSettingsForm.whatsapp} onChange={(event) => updateSiteSetting('whatsapp', event.target.value)} maxLength="40" /></label>
                        </div>
                        <label className="demo-checkbox">
                          <input type="checkbox" checked={siteSettingsForm.contactsAreReal} onChange={(event) => updateSiteSetting('contactsAreReal', event.target.checked)} />
                          Recapiti verificati e reali: abilita i link per email, telefono e WhatsApp
                        </label>
                        {!siteSettingsForm.contactsAreReal ? <p className="form-help">I valori attuali sono di esempio: sul sito saranno visibili ma non cliccabili finché non confermi i recapiti reali.</p> : null}
                      </section>

                      <section className="vehicle-form-section">
                        <h4>Logo</h4>
                        <label>URL logo HTTPS<input type="url" value={siteSettingsForm.logoUrl.startsWith('/api/site-assets/') || siteSettingsForm.logoUrl === '/logo.png' ? '' : siteSettingsForm.logoUrl} onChange={(event) => updateSiteSetting('logoUrl', event.target.value)} maxLength="500" placeholder="Facoltativo: https://..." /></label>
                        <label className="image-upload-label">Carica dal computer <span className="optional">PNG, JPEG o WebP · massimo 5 MB</span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadSiteLogo} disabled={adminBusy || logoUploadBusy} /></label>
                        {logoUploadBusy ? <p className="admin-loading" role="status">Caricamento logo…</p> : null}
                        {logoUploadError ? <p className="notice notice-error">{logoUploadError}</p> : null}
                        {siteSettingsForm.logoUrl ? <img className="site-logo-preview" src={siteSettingsForm.logoUrl} alt="Anteprima logo" /> : null}
                        {siteSettingsForm.logoUrl !== '/logo.png' ? <button type="button" className="text-link" onClick={() => updateSiteSetting('logoUrl', '/logo.png')}>Ripristina logo iniziale</button> : null}
                        <p className="form-help">Il logo iniziale usa il file client/public/logo.png. Un logo caricato qui sostituisce quello iniziale.</p>
                      </section>

                      <section className="vehicle-form-section">
                        <h4>Referenti pubblici</h4>
                        <label>Nomi mostrati nel footer <span className="optional">(uno per riga)</span><textarea rows="3" value={siteSettingsForm.publicAdminsText} onChange={(event) => updateSiteSetting('publicAdminsText', event.target.value)} maxLength="850" placeholder={'Luigi Peluso\nGerardo Peluso'} /></label>
                        <p className="form-help">Questo elenco è pubblico e non crea nuovi account di accesso all’area admin.</p>
                      </section>

                      <div className="form-actions">
                        <button className="button button-dark" disabled={adminBusy || logoUploadBusy}>{adminBusy ? 'Salvataggio…' : 'Salva impostazioni'}</button>
                      </div>
                      {adminError ? <p className="notice notice-error" role="alert">{adminError}</p> : null}
                      {siteSettingsMessage ? <p className="notice notice-success" role="status">{siteSettingsMessage}</p> : null}
                    </form>
                  </section>
                )}
              </>
            )}
          </section>
        </div>
      ) : null}
      {vehicleToDelete ? (
        <DeleteVehicleDialog vehicle={vehicleToDelete} busy={deleteBusy} error={deleteError} onCancel={() => setVehicleToDelete(null)} onConfirm={() => deleteVehicle(vehicleToDelete._id)} />
      ) : null}
      {dealerContactVehicle ? <DealerContactDialog vehicle={dealerContactVehicle} settings={siteSettings} onClose={() => setDealerContactVehicle(null)} /> : null}
      {contactError || contactMessage ? (
        <SiteDialog role="alertdialog" titleId="contact-feedback-title" descriptionId="contact-feedback-description" onCancel={() => { setContactError(''); setContactMessage(''); }}>
          <p className="eyebrow">MESSAGGIO</p>
          <h2 id="contact-feedback-title">{contactError ? 'Invio non riuscito' : 'Messaggio inviato'}</h2>
          <p id="contact-feedback-description">{contactError || contactMessage}</p>
          <div className="confirm-actions">
            <button type="button" className="button button-dark" autoFocus onClick={() => { setContactError(''); setContactMessage(''); }}>Chiudi</button>
          </div>
        </SiteDialog>
      ) : null}
      {siteSettings.contactsAreReal && String(siteSettings.whatsapp || '').replace(/\D/g, '') ? (
        <a
          className="whatsapp-floating"
          href={`https://wa.me/${String(siteSettings.whatsapp || '').replace(/\D/g, '')}?text=${encodeURIComponent('Buongiorno, vorrei ricevere informazioni da Peluso Group.')}`}
          target="_blank"
          rel="noreferrer"
          aria-label="Contatta Peluso Group su WhatsApp"
        >
          <WhatsAppIcon />
          <span>WhatsApp</span>
        </a>
      ) : null}
    </>
  );
}

export default App;
