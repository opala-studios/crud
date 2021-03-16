import {
  CollectionReference,
  DocumentData,
  DocumentSnapshot,
  Timestamp,
  Firestore,
  DocumentReference,
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
      throw new Error('Only one field can be id per collection');
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

  public async createMany(bulk: Record<string, any>[]): Promise<T[]> {
    const now = Timestamp.fromDate(new Date());

    const docs: DocumentReference<DocumentData>[] = [];
    const batch = this.firestore.batch();
    bulk.forEach((data) => {
      const doc = data[this.idFieldName]
        ? this.collection.doc(data[this.idFieldName])
        : this.collection.doc();

      if (this.timestamp) {
        data = { ...data, [this.createdAtField]: now, [this.updatedAtField]: now };
      }

      if (this.softDelete) {
        data = { ...data, [this.softDeleteField]: false };
      }

      batch.set(doc, data);
      docs.push(doc);
    });

    await batch.commit();

    return docs.map((doc) => ({ [this.idFieldName]: doc.id })) as any[];
  }

  public async updateOne(data: Record<string, any>): Promise<T> {
    if (!data[this.idFieldName]) {
      throw new Error('Id is required to update one document');
    }

    const doc = this.collection.doc(data[this.idFieldName]);
    delete data[this.idFieldName];

    if (this.timestamp) {
      const now = Timestamp.fromDate(new Date());
      data = { ...data, [this.updatedAtField]: now };
    }

    await doc.update({ ...data });
    const snapshot = await doc.get();
    return this.toEntity(snapshot);
  }
}
