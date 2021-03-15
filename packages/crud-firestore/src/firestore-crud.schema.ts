export interface CollectionField {
  name: string;
  isPrimary?: boolean;
}

export interface FirestoreCrudSchema {
  collection: string;
  fields?: CollectionField[];
  timestamp?: boolean;
  softDelete?: boolean;
}
