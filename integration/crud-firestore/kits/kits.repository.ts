import { DocumentData, DocumentSnapshot, Firestore } from "@google-cloud/firestore";
import { Inject } from "@nestjs/common";
import { FirestoreCrudRepository } from "@opala-studios/crud-firestore";
import { FIRESTORE } from "../shared/firestore";
import { Kit } from "./kit.entity";

export class KitsRepository extends FirestoreCrudRepository<Kit> {
    constructor(
        @Inject(FIRESTORE) firestore: Firestore
    ) {
        super(firestore, Kit);
    }

    // protected toEntity(snapshot: DocumentSnapshot<DocumentData>): Kit {
    //     const data = snapshot.data();
    //     return {
    //         id: snapshot.id,
    //         name: data.name,
    //         createdAt: data.createdAt?.toDate(),
    //         updatedAt: data.updatedAt?.toDate(),
    //         isDeleted: data.isDeleted
    //     };
    // }
}