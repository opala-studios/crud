export interface CollectionField {
  name: string;
  isId: boolean;
}

export interface FirestoreCrudSchema {
  collection: string;
  fields?: CollectionField[];
  timestamp?: boolean;
  softDelete?: boolean;
}
