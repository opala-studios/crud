import {
  CollectionReference,
  DocumentData,
  DocumentSnapshot,
  Timestamp,
} from '@google-cloud/firestore';
import { FirestoreCrudSchema } from './firestore-crud.schema';

export abstract class FirestoreCrudRepository<T> {
  protected readonly createdAtField: string = 'createdAt';
  protected readonly updatedAtField: string = 'updatedAt';
  protected readonly softDeleteField: string = 'isDeleted';
  protected primaryField: string = 'id';

  protected timestamp: boolean = false;
  protected softDelete: boolean = false;

  constructor(
    public readonly schema: FirestoreCrudSchema,
    public readonly collection: CollectionReference<DocumentData>,
  ) {
    this.onInitMapCollectionFields();
  }

  private onInitMapCollectionFields() {
    this.primaryField = this.schema.fields
      .filter((field) => field.isPrimary)
      .map((field) => field.name)[0];
    this.timestamp = this.schema.timestamp;
    this.softDelete = this.schema.softDelete;
  }

  public toEntity(snapshot: DocumentSnapshot<DocumentData>): T | Promise<T> {
    return { id: snapshot.id, ...snapshot.data() } as any;
  }

  public async createOne(data: Record<string, any>): Promise<T> {
    const document = data[this.primaryField]
      ? this.collection.doc(data[this.primaryField])
      : this.collection.doc();

    if (this.timestamp) {
      const now = Timestamp.fromDate(new Date());
      data = { ...data, [this.createdAtField]: now, [this.updatedAtField]: now };
    }

    if (this.softDelete) {
      data = { ...data, [this.softDeleteField]: false };
    }

    await document.set({ ...data });
    const snapshot = await document.get();
    return this.toEntity(snapshot);
  }
}
