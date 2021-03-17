import {
  CollectionReference,
  DocumentData,
  FieldPath,
  Firestore,
  OrderByDirection,
  Query,
  QuerySnapshot,
  WhereFilterOp,
} from '@google-cloud/firestore';
import { FirestoreCrudSchema } from './firestore-crud.interfaces';

export class FirestoreQueryBuilder {
  protected query: Query<DocumentData>;

  constructor(protected firestore: Firestore, protected schema: FirestoreCrudSchema) {}

  get collection(): CollectionReference<DocumentData> {
    return this.firestore.collection(this.schema.collection);
  }

  get queryOrCollection(): Query<DocumentData> | CollectionReference<DocumentData> {
    return this.query ? this.query : this.collection;
  }

  where(fieldPath: string | FieldPath, operator: WhereFilterOp, value: any) {
    this.query = this.queryOrCollection.where(fieldPath, operator, value);
  }

  select(...fields: (string | FieldPath)[]) {
    this.query = this.queryOrCollection.select(...fields);
  }

  orderBy(fieldPath: string | FieldPath, direction?: OrderByDirection) {
    this.query = this.queryOrCollection.orderBy(fieldPath, direction);
  }

  limit(limit: number) {
    this.query = this.queryOrCollection.limit(limit);
  }

  offset(offset: number) {
    this.query = this.queryOrCollection.offset(offset);
  }

  get(): Promise<QuerySnapshot<DocumentData>> {
    return this.queryOrCollection.get();
  }
}
