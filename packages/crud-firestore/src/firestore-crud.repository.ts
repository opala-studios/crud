import {
  CollectionReference,
  DocumentData,
  DocumentSnapshot,
  Timestamp,
  Firestore,
} from '@google-cloud/firestore';
import { FirestoreCrudSchema } from './firestore-crud.schema';

export abstract class FirestoreCrudRepository<T> {
  protected readonly createdAtField: string = 'createdAt';
  protected readonly updatedAtField: string = 'updatedAt';
  protected readonly softDeleteField: string = 'isDeleted';
  protected idFieldName: string = 'id';
  protected timestamp: boolean = false;
  protected softDelete: boolean = false;

  constructor(
    public readonly firestore: Firestore,
    public readonly schema: FirestoreCrudSchema,
  ) {
    this.onInitMapCollectionFields();
  }

  get collection(): CollectionReference<DocumentData> {
    return this.firestore.collection(this.schema.collection);
  }

  private onInitMapCollectionFields() {
    const idFields = this.schema.fields.filter((field) => field.isId);
    if (idFields.length > 1) {
      throw new Error('only one field can be id per collection');
    }

    this.idFieldName = idFields.map((field) => field.name)[0];
    this.timestamp = this.schema.timestamp;
    this.softDelete = this.schema.softDelete;
  }

  public toEntity(snapshot: DocumentSnapshot<DocumentData>): T | Promise<T> {
    return { [this.idFieldName]: snapshot.id, ...snapshot.data() } as any;
  }

  public async createOne(data: Record<string, any>): Promise<T> {
    const doc = data[this.idFieldName]
      ? this.collection.doc(data[this.idFieldName])
      : this.collection.doc();

    delete data[this.idFieldName];

    if (this.timestamp) {
      const now = Timestamp.fromDate(new Date());
      data = { ...data, [this.createdAtField]: now, [this.updatedAtField]: now };
    }

    if (this.softDelete) {
      data = { ...data, [this.softDeleteField]: false };
    }

    await doc.set({ ...data });
    const snapshot = await doc.get();
    return this.toEntity(snapshot);
  }
}
