import { FirestoreCrudSchema } from "@opala-studios/crud-firestore";

export const kitSchema = {
    collection: 'kits',
    fields: [
        { name: 'id', isId: true },
        { name: 'name' },
        { name: 'createdAt' },
        { name: 'updatedAt' },
        { name: 'isDeleted' }
    ],
    timestamp: true,
    softDelete: true
} as FirestoreCrudSchema;