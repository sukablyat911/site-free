const fs = require('node:fs/promises');
const path = require('node:path');
const bcrypt = require('bcryptjs');

const root = path.resolve(__dirname, '..');
const argument = process.argv[2];
const envFile = argument ? path.resolve(process.cwd(), argument) : path.join(root, '.env');

function readHidden(prompt) {
  if (!process.stdin.isTTY) {
    throw new Error('Il reset richiede un terminale interattivo.');
  }

  return new Promise((resolve, reject) => {
    let value = '';
    let completed = false;

    const finish = (error, result) => {
      if (completed) return;
      completed = true;
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.off('data', onData);
      process.stdout.write('\n');
      if (error) reject(error);
      else resolve(result);
    };

    const onData = (chunk) => {
      const key = chunk.toString('utf8');
      if (key === '\u0003') {
        finish(new Error('Operazione annullata.'));
      } else if (key === '\r' || key === '\n') {
        finish(null, value);
      } else if (key === '\u0008' || key === '\u007f') {
        value = value.slice(0, -1);
      } else if (!key.startsWith('\u001b')) {
        value += key;
      }
    };

    process.stdout.write(prompt);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', onData);
  });
}

function replacePasswordHash(envContents, passwordHash) {
  const lineEnding = envContents.includes('\r\n') ? '\r\n' : '\n';
  const lines = envContents.split(/\r?\n/);
  let found = false;

  const updatedLines = lines.map((line) => {
    if (/^\s*ADMIN_PASSWORD_HASH\s*=/.test(line)) {
      found = true;
      return `ADMIN_PASSWORD_HASH=${passwordHash}`;
    }
    return line;
  });

  if (!found) updatedLines.push(`ADMIN_PASSWORD_HASH=${passwordHash}`);
  return updatedLines.join(lineEnding);
}

async function main() {
  let envContents;
  try {
    envContents = await fs.readFile(envFile, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`File .env non trovato: ${envFile}`);
    }
    throw error;
  }

  const password = await readHidden('Nuova password admin: ');
  if (Buffer.byteLength(password, 'utf8') < 12) {
    throw new Error('La password deve contenere almeno 12 caratteri.');
  }
  if (Buffer.byteLength(password, 'utf8') > 72) {
    throw new Error('La password non può superare 72 byte UTF-8.');
  }

  const confirmation = await readHidden('Conferma nuova password: ');
  if (password !== confirmation) {
    throw new Error('Le password non coincidono. Nessuna modifica effettuata.');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const updatedContents = replacePasswordHash(envContents, passwordHash);
  const temporaryFile = `${envFile}.${process.pid}.tmp`;

  await fs.writeFile(temporaryFile, updatedContents, { encoding: 'utf8', mode: 0o600 });
  await fs.rename(temporaryFile, envFile);
  console.log(`Password admin aggiornata in ${envFile}. Riavvia il backend per applicarla.`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`Errore: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { replacePasswordHash };