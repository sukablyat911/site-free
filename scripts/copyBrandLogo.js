require('dotenv').config({ path: require('node:path').resolve(__dirname, '../.env') });

const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const sourcePath = process.env.SITE_LOGO_SOURCE
  ? path.resolve(process.env.SITE_LOGO_SOURCE)
  : path.join(os.homedir(), 'Downloads', 'logo', 'logo.png');
const destinationPath = path.resolve(__dirname, '../client/public/logo.png');
const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

async function copyBrandLogo() {
  try {
    await fs.access(destinationPath);
    console.log('Logo locale già presente in client/public/logo.png.');
    return;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  let contents;
  try {
    contents = await fs.readFile(sourcePath);
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Logo non trovato: ${sourcePath}. Configura SITE_LOGO_SOURCE o aggiungi il logo alla cartella indicata.`);
    }
    throw error;
  }

  if (contents.length < pngSignature.length || !contents.subarray(0, 8).equals(pngSignature)) {
    throw new Error(`Il file ${sourcePath} non è un PNG valido.`);
  }

  await fs.mkdir(path.dirname(destinationPath), { recursive: true });
  await fs.writeFile(destinationPath, contents, { flag: 'wx' });
  console.log('Logo Peluso Group copiato in client/public/logo.png.');
}

copyBrandLogo().catch((error) => {
  console.error('Preparazione logo non riuscita:', error.message);
  process.exitCode = 1;
});
