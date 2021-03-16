import {
  CollectionReference,
  DocumentData,
  DocumentSnapshot,
  Timestamp,
  Firestore,
  DocumentReference,
} from '@google-cloud/firestore';
import { FirestoreCrudOptions, FirestoreCrudSchema } from './firestore-crud.interfaces';

export abstract class FirestoreCrudRepository<T> {
  protected readonly createdAtField: string = 'createdAt';
  protected readonly updatedAtField: string = 'updatedAt';
  protected readonly softDeleteField: string = 'isDeleted';
  protected idFieldName: string = 'id';
  protected timestamp: boolean = true;
  protected softDelete: boolean = true;

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
    const idFields = this.schema.fields
      .filter((field) => field.isId)
      .map((field) => field.name);
    if (idFields.length > 1) {
      throw new Error('Only one field can be id per collection');
    }

    if (idFields.length) {
      this.idFieldName = idFields[0];
    }

    this.timestamp = this.schema.timestamp;
    this.softDelete = this.schema.softDelete;
  }

  public toEntity(snapshot: DocumentSnapshot<DocumentData>): T | Promise<T> {
    return { [this.idFieldName]: snapshot.id, ...snapshot.data() } as any;
  }

  public async saveOne(
    data: Record<string, any>,
    options?: FirestoreCrudOptions,
  ): Promise<T> {
    const doc = data[this.idFieldName]
      ? this.collection.doc(data[this.idFieldName])
      : this.collection.doc();

    const findedSnapshot = await doc.get();
    const exists = findedSnapshot.exists;

    const softDelete = options ? options.softDelete : this.softDelete;
    const timestamp = options ? options.timestamp : this.timestamp;

    if (timestamp) {
      const now = Timestamp.fromDate(new Date());

      if (!exists) {
        data = { ...data, [this.createdAtField]: now };
      }

      data = { ...data, [this.updatedAtField]: now };
    }

    if (softDelete) {
      data = {
        ...data,
        [this.softDeleteField]: data[this.softDeleteField]
          ? data[this.softDeleteField]
          : false,
      };
    }

    delete data[this.idFieldName];
    await doc.set({ ...data });
    const savedSnapshot = await doc.get();
    return this.toEntity(savedSnapshot);
  }

  public async removeOne(id: string, options?: FirestoreCrudOptions): Promise<void> {
    const doc = this.collection.doc(id);

    const softDelete = options ? options.softDelete : this.softDelete;
    const timestamp = options ? options.timestamp : this.timestamp;

    if (softDelete) {
      let data: Record<string, any> = { [this.softDeleteField]: true };
      if (timestamp) {
        const now = Timestamp.fromDate(new Date());
        data = { ...data, [this.updatedAtField]: now };
      }

      await doc.set({ ...data });
    } else {
      await doc.delete();
    }
  }

  public async createMany(
    bulk: Record<string, any>[],
    options?: FirestoreCrudOptions,
  ): Promise<T[]> {
    const now = Timestamp.fromDate(new Date());

    const softDelete = options ? options.softDelete : this.softDelete;
    const timestamp = options ? options.timestamp : this.timestamp;

    const docs: DocumentReference<DocumentData>[] = [];
    const batch = this.firestore.batch();
    bulk.forEach((data) => {
      const doc = data[this.idFieldName]
        ? this.collection.doc(data[this.idFieldName])
        : this.collection.doc();

      if (timestamp) {
        data = { ...data, [this.createdAtField]: now, [this.updatedAtField]: now };
      }

      if (softDelete) {
        data = {
          ...data,
          [this.softDeleteField]: data[this.softDeleteField]
            ? data[this.softDeleteField]
            : false,
        };
      }

      batch.set(doc, data);
      docs.push(doc);
    });

    await batch.commit();

    return docs.map((doc) => ({ [this.idFieldName]: doc.id })) as any[];
  }
}
