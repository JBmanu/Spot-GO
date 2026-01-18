import {clearDocuments, createDocument, documentFromId} from "./goalsConnector.js";

const DISCOUNT_COLLECTION = "Discount";

export async function createDiscount(data) {
    return await createDocument(DISCOUNT_COLLECTION, {
        Name: data.Name,
        PlaceId: data.Description ?? "",
        Percentage: data.Percentage ?? null,
        Amount: data.Amount ?? null
    });
}

export async function clearDiscounts() {
    await clearDocuments(DISCOUNT_COLLECTION)
}

export async function discount(id) {
    return await documentFromId(DISCOUNT_COLLECTION, id);
}