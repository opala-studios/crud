import { Firestore } from "@google-cloud/firestore";
import { Inject } from "@nestjs/common";
import { FirestoreCrudRepository, FirestoreCrudSchema } from "@opala-studios/crud-firestore";
import { Kit } from "./kit.entity";
import { FIRESTORE, KIT_SCHEMA } from "./kits.constants";

export class KitsRepository extends FirestoreCrudRepository<Kit> {
    constructor(
        @Inject(FIRESTORE) firestore: Firestore,
        @Inject(KIT_SCHEMA) schema: FirestoreCrudSchema
    ) {
        super(firestore, schema);
    }
}