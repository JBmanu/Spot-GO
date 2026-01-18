import {clearDiscounts, createDiscount} from "../discountConnector.js"; // importa la tua funzione

// 🎫 Sconti catalogo ITALIANI / EMILIA-ROMAGNA
const DISCOUNTS_TO_CREATE = [
    // --- CIBO ---
    {
        Name: "Sconto Trattoria",
        Description: "10% nelle trattorie tipiche emiliane",
        Percentage: 10,
        Amount: null
    },
    {
        Name: "Mangia e Bevi Bologna",
        Description: "15% nei locali del centro storico di Bologna",
        Percentage: 15,
        Amount: null
    },
    {
        Name: "Piadina Lovers",
        Description: "20% nelle migliori piadinerie di Rimini e Riccione",
        Percentage: 20,
        Amount: null
    },

    // --- CULTURA ---
    {
        Name: "Museo di Bologna",
        Description: "25% sul biglietto dei musei civici di Bologna",
        Percentage: 25,
        Amount: null
    },
    {
        Name: "Arte a Parma",
        Description: "15% su mostre e musei a Parma",
        Percentage: 15,
        Amount: null
    },
    {
        Name: "Ferrara Storica",
        Description: "20% per visitare il Castello Estense a Ferrara",
        Percentage: 20,
        Amount: null
    },

    // --- NATURA ---
    {
        Name: "Escursioni Appennino",
        Description: "10% su esperienze e trekking nell’Appennino",
        Percentage: 10,
        Amount: null
    },
    {
        Name: "Comacchio Wild",
        Description: "15% su tour naturalistici nelle Valli di Comacchio",
        Percentage: 15,
        Amount: null
    },

    // --- DIVERTIMENTO ---
    {
        Name: "Mirabilandia Ride Pass",
        Description: "5€ di sconto su biglietto Mirabilandia",
        Percentage: null,
        Amount: 5
    },
    {
        Name: "Teatro Regio Parma",
        Description: "20% su spettacoli e opere al Teatro Regio",
        Percentage: 20,
        Amount: null
    },
    {
        Name: "FICO Experience",
        Description: "20% su esperienze e degustazioni a FICO",
        Percentage: 20,
        Amount: null
    },

    // --- MISTERO ---
    {
        Name: "Castello Maledetto",
        Description: "10% per la visita al Castello di Montebello (Azzurrina)",
        Percentage: 10,
        Amount: null
    },
    {
        Name: "Enigma di San Leo",
        Description: "15% sulla visita alla Fortezza di San Leo",
        Percentage: 15,
        Amount: null
    },

    // --- GENERICI USABILI OVUNQUE ---
    {
        Name: "Sconto Emilia",
        Description: "10% su attività selezionate in tutta l’Emilia",
        Percentage: 10,
        Amount: null
    },
    {
        Name: "Weekend Explorer",
        Description: "5% su esperienze weekend in Emilia-Romagna",
        Percentage: 5,
        Amount: null
    }
];

export let createdDiscountIds = [];

export async function seedDiscounts() {
    await clearDiscounts();
    for (const discount of DISCOUNTS_TO_CREATE) {
        const id = await createDiscount(discount);
        createdDiscountIds.push(id);
    }

    console.log("🎉 Creazione " + DISCOUNTS_TO_CREATE.length + "sconti completata!");
}
