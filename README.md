# Peluso Group FREE

Versione essenziale e indipendente della vetrina: elenco auto, scheda dedicata per ogni annuncio, contatti e pannello admin per gestire annunci e messaggi. I dettagli tecnici e le dotazioni sono facoltativi: inserisci solo informazioni verificate; i dati mancanti sono indicati nella scheda. Non modifica la cartella `pelusogroup` (PRO).

## Avvio in locale

Apri un terminale in `pelusogroup-free` e installa le dipendenze:

```powershell
npm install
npm install --prefix client
Copy-Item .env.example .env
```

Configura nel file `.env`:

- `MONGO_URI`: URI del cluster MongoDB Atlas.
- `DNS_SERVERS`: resolver DNS usati per trovare il cluster Atlas (default: `1.1.1.1,1.0.0.1`).
- `ADMIN_USERNAME`: nome utente per l’area admin.
- `ADMIN_PASSWORD_HASH`: hash bcrypt della password admin.
- `SESSION_SECRET`: segreto casuale di almeno 32 caratteri.

Sostituisci i segnaposto dell’URI in `.env.example` con il connection string Atlas dell’utente database FREE.

Genera un hash password e un segreto nuovi dal terminale:

```powershell
node -e "require('bcryptjs').hash(process.argv[1], 12).then(console.log)" "scegli-una-password-forte"
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Avvia frontend e backend:

```powershell
npm run dev
```

Apri `http://127.0.0.1:5174`. Il backend usa la porta `5001`, distinta da quella della versione PRO (`5000`).

## Database

FREE usa il database `pelusogroup_free`, selezionato esplicitamente dal server. Può stare nello stesso cluster Atlas della PRO: non serve un secondo cluster. Crea in Atlas un utente database con accesso `readWrite` **solo** al database `pelusogroup_free`, configura le regole Network Access e usa il suo URI in questo `.env`. Non copiare né condividere il file `.env` della PRO.

Le auto e i messaggi di contatto vengono salvati in questo database; non vengono condivisi con la PRO. I messaggi sono consultabili dall’area admin, dove puoi cercare e filtrare le richieste. Le richieste inviate da una scheda auto conservano il riferimento all'annuncio; le schede demo non sono richiedibili. Il catalogo supporta ricerca, filtri e ordinamento e ogni card è apribile interamente. Ogni annuncio può avere fino a 8 foto: puoi inserire un URL HTTPS oppure caricare JPEG, PNG o WebP dal computer (massimo 8 MB per file). Le foto caricate sono conservate in `server/uploads/cars`; in produzione assicurati che questa cartella sia su storage persistente. Dall'anteprima immagini nell'admin puoi scegliere la copertina oppure rimuovere una foto. Le schede dedicate mostrano le informazioni organizzate per caratteristiche, motore e trasmissione, prestazioni e consumi, condizioni e coperture, manutenzione, dotazioni e piano rateale; i campi non compilati sono indicati come non specificati. I campi standard dell'annuncio come alimentazione, carrozzeria, cambio, trazione, condizione e classe emissioni si scelgono da menu. L’area admin permette di inserire anche i costi aggiuntivi e le condizioni del piano rateale: inserisci solo informazioni verificate. L’app non invia email.

## Auto a noleggio

Nell'inventario admin seleziona **Noleggio**, inserisci la tariffa giornaliera e, se note, le condizioni (ad esempio deposito, chilometri inclusi e assicurazione). Puoi sospendere le richieste senza eliminare l'annuncio. Gli annunci esistenti restano di vendita. Nel catalogo il filtro distingue vendita e noleggio; se sono presenti noleggi, budget e ordinamento per prezzo sono disponibili dopo la scelta, per non confrontare prezzi di vendita e tariffe giornaliere.

Il cliente indica le date di ritiro e riconsegna nella richiesta, consultabile nella sezione **Messaggi** dell'admin. Le richieste non sono prenotazioni: non bloccano date, non verificano disponibilità e non prevedono pagamenti o notifiche email. La concessionaria deve confermare manualmente disponibilità, prezzo totale e condizioni. Riavvia il backend dopo l'aggiornamento per attivare il noleggio.

Per importare nella FREE gli annunci reali di vendita della PRO, esegui `npm run import:pro` dalla cartella FREE. Il comando legge il `.env` della PRO senza stamparne le credenziali, esclude noleggi e annunci dimostrativi, copia le foto caricate e inserisce una copia indipendente nel database `pelusogroup_free`. Importa il prezzo attualmente applicabile e la modalità IVA. Non modifica i dati della PRO e non duplica annunci già importati.

Per creare o aggiornare sei schede demo con foto dalla cartella Windows `Pictures`, esegui `npm run seed:pictures`. Copia una foto per ogni modello selezionato e mostra chiaramente la dicitura DEMO; prezzi e specifiche sono solo valori d’esempio. Aggiorna le schede già create senza duplicarle e non elimina altre schede demo.

Per rimuovere in una volta sola solo le auto dimostrative, esegui `npm run remove:demo` dalla cartella FREE.

## Impostazioni pubbliche e logo

Dall’area admin apri **Impostazioni** per configurare aliquota IVA, email, telefono, WhatsApp, logo e nomi pubblici dei referenti. Luigi e Gerardo sono mostrati come referenti: questa lista non crea account e non cambia l’accesso admin, che resta configurato tramite `.env`.

I recapiti iniziali sono segnaposto (`info@example.com` e numeri non reali). Restano non cliccabili finché non inserisci quelli corretti e confermi nell’area admin che sono reali. Il numero WhatsApp configurato abilita un pulsante fisso e i link precompilati dalle schede auto. Dalla stessa area puoi configurare i link HTTPS di Facebook, Instagram, TikTok e YouTube. L’aliquota configurata viene mostrata sulle auto con prezzo impostato come “IVA esclusa”.
I recapiti confermati sono disponibili anche come link diretti nella sezione Contatti; altrimenti è disponibile il modulo messaggi.

Se `client/public/logo.png` non esiste, il logo iniziale viene copiato da `Downloads\logo\logo.png` quando avvii o compili il sito. Se il file si trova altrove, configura `SITE_LOGO_SOURCE` in `.env` con il percorso completo al PNG. Un logo già presente in `client/public/logo.png` non viene sovrascritto: puoi sostituirlo direttamente. Puoi anche caricare PNG, JPEG o WebP dalle impostazioni (massimo 5 MB); i loghi caricati sono salvati in `server/uploads/branding`, che deve usare storage persistente in produzione. Per tornare al logo iniziale usa **Ripristina logo iniziale** e poi **Salva impostazioni**.

## Produzione

```powershell
npm run build
npm start
```

In produzione configura `NODE_ENV=production`, `CLIENT_ORIGIN` e le variabili del `.env` nel pannello del provider. Non caricare mai `.env` su Git: è escluso dal `.gitignore`.
