export interface FirestoreCrudOptions {
  timestamp?: boolean;
  softDelete?: boolean;
}

export interface FirestoreCrudSchema
  extends Pick<FirestoreCrudOptions, 'timestamp' | 'softDelete'> {
  collection: string;
  fields?: FirestoreCrudField[];
}

export interface FirestoreCrudField {
  name: string;
  isId?: boolean;
}
