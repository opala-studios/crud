import { FirestoreCrudField, FirestoreCrudSchema } from '.';
import { FirestoreCrudMetadata } from './firestore-crud.metadata';

export function Schema(schema: FirestoreCrudSchema): ClassDecorator {
  return function(target: Function) {
    FirestoreCrudMetadata.addSchema(target, schema);
  };
}

export function Field(field?: FirestoreCrudField): PropertyDecorator {
  return function(target: Object, propertyKey: string) {
    FirestoreCrudMetadata.addField(target, propertyKey, field);
  };
}
