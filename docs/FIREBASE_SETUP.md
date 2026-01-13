# Guida Firebase Spot-GO

## Configurazione Unificata
Unificata la configurazione di Firebase nel file:
`src/js/firebase.js`

Grazie a **vite-node**, questa configurazione viene usata sia dall'app frontend che dagli script da terminale, evitando duplicazioni.

## Comandi Disponibili

### 1. Avvio Sviluppo
```bash
npm run dev
```
Avvia l'app e il compilatore CSS.

### 2. Caricamento/Reset Dati su Firebase
```bash
npm run db:push
```
Questo comando esegue `database.js` tramite `vite-node`.
- **Cosa fa**: Prende i dati dai file JSON locali in `src/db/json/` e li carica su Firestore.
- **Attenzione**: Lo script resetta (cancella) le collezioni esistenti prima di caricare i nuovi dati.

## Struttura File
- `database.js`: Script di utility per il popolamento del database.
- `src/js/firebase.js`: Inizializzazione ufficiale di Firebase.
- `src/.env`: File contenente le chiavi API (NON caricare su GitHub).

## Requisiti
- Node.js versione >= 20.
- `vite-node` (installato come devDependency).
