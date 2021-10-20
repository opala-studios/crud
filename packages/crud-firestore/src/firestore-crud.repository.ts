import {
  CollectionReference,
  DocumentData,
  DocumentSnapshot,
  Timestamp,
  Firestore,
  DocumentReference,
} from '@google-cloud/firestore';
import { FirestoreCrudOptions, FirestoreCrudSchema } from './firestore-crud.interfaces';
import { FirestoreQueryBuilder } from './firestore-query-builder.model';

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

  protected get collection(): CollectionReference<DocumentData> {
    return this.firestore.collection(this.schema.collection);
  }

  private onInitMapCollectionFields() {
    const idFields = this.schema.fields
      .filter((field) => field.isId)
      .map((field) => field.name);
    if (idFields.length > 1) {
      throw new Error(`${this.schema.collection} can be only one id`);
    }

    if (idFields.length) {
      this.idFieldName = idFields[0];
    }

    this.timestamp = this.schema.timestamp;
    this.softDelete = this.schema.softDelete;
  }

  protected toEntity(snapshot: DocumentSnapshot<DocumentData>): T {
    return { [this.idFieldName]: snapshot.id, ...snapshot.data() } as any;
  }

  buildQuery(
    withDeleted: boolean = false,
    options?: FirestoreCrudOptions,
  ): FirestoreQueryBuilder {
    const queryBuilder = new FirestoreQueryBuilder(this.firestore, this.schema);
    const { softDelete } = this.getOptions(options);
    if (!withDeleted && softDelete) {
      queryBuilder.where(this.softDeleteField, '==', false);
    }

    return queryBuilder;
  }

  async createOne(data: Record<string, any>, options?: FirestoreCrudOptions): Promise<T> {
    const doc = data[this.idFieldName]
      ? this.collection.doc(`${data[this.idFieldName]}`)
      : this.collection.doc();

    const { softDelete, timestamp } = this.getOptions(options);

    if (timestamp) {
      const now = Timestamp.fromDate(new Date());
      data = { ...data, [this.createdAtField]: now, [this.updatedAtField]: now };
    }

    if (softDelete) {
      data = { ...data, [this.softDeleteField]: false };
    }

    delete data[this.idFieldName];
    await doc.create({ ...data });
    const savedSnapshot = await doc.get();
    return this.toEntity(savedSnapshot);
  }

  async saveOne(data: Record<string, any>, options?: FirestoreCrudOptions): Promise<T> {
    const doc = data[this.idFieldName]
      ? this.collection.doc(`${data[this.idFieldName]}`)
      : this.collection.doc();

    const findedSnapshot = await doc.get();
    const exists = findedSnapshot.exists;

    const { softDelete, timestamp } = this.getOptions(options);

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
    await doc.update({ ...data });
    const savedSnapshot = await doc.get();
    return this.toEntity(savedSnapshot);
  }

  async removeOne(id: string, options?: FirestoreCrudOptions): Promise<void> {
    const doc = this.collection.doc(`${id}`);

    const { softDelete, timestamp } = this.getOptions(options);

    if (softDelete) {
      let data: Record<string, any> = { [this.softDeleteField]: true };
      if (timestamp) {
        const now = Timestamp.fromDate(new Date());
        data = { ...data, [this.updatedAtField]: now };
      }

      await doc.update({ ...data });
    } else {
      await doc.delete();
    }
  }

  async recoverOne(id: string, options?: FirestoreCrudOptions): Promise<T> {
    const doc = this.collection.doc(`${id}`);

    const { softDelete, timestamp } = this.getOptions(options);

    if (!softDelete) {
      throw new Error(`${this.schema.collection} don't use soft delete`);
    }

    let data: Record<string, any> = { [this.softDeleteField]: false };
    if (timestamp) {
      const now = Timestamp.fromDate(new Date());
      data = { ...data, [this.updatedAtField]: now };
    }

    await doc.update({ ...data });
    const snapshot = await doc.get();
    return this.toEntity(snapshot);
  }

  async createMany(
    bulk: Record<string, any>[],
    options?: FirestoreCrudOptions,
  ): Promise<T[]> {
    const now = Timestamp.fromDate(new Date());

    const { softDelete, timestamp } = this.getOptions(options);

    const docs: DocumentReference<DocumentData>[] = [];
    const batch = this.firestore.batch();
    bulk.forEach((data) => {
      const doc = data[this.idFieldName]
        ? this.collection.doc(`${data[this.idFieldName]}`)
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

      batch.create(doc, data);
      docs.push(doc);
    });

    await batch.commit();

    return docs.map((doc) => ({ [this.idFieldName]: doc.id })) as any[];
  }

  async find(queryBuilder: FirestoreQueryBuilder): Promise<T[]> {
    const snapshot = await queryBuilder.get();
    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map((doc) => {
      return this.toEntity(doc);
    });
  }

  async count(queryBuilder: FirestoreQueryBuilder): Promise<number> {
    const snapshot = await queryBuilder.get();
    return snapshot.size;
  }

  private getOptions(options?: FirestoreCrudOptions): FirestoreCrudOptions {
    const softDelete = options
      ? options.softDelete !== undefined
        ? options.softDelete
        : this.softDelete
      : this.softDelete;

    const timestamp = options
      ? options.timestamp !== undefined
        ? options.timestamp
        : this.timestamp
      : this.timestamp;

    return { softDelete, timestamp };
  }
}
