import { FirestoreCrudField, FirestoreCrudSchema } from '.';

export class FirestoreCrudMetadata {
  private static getMetadataKey(target: Function, propertyKey?: string) {
    const metadataKey = propertyKey ? `${target.name}.${propertyKey}` : target.name;
    return `firestore/${metadataKey}`;
  }

  public static addSchema(target: Function, schema: FirestoreCrudSchema): void {
    Reflect.defineMetadata(
      FirestoreCrudMetadata.getMetadataKey(target),
      schema || {},
      target,
    );
  }

  public static addField(
    target: Object,
    propertyKey: string,
    field: FirestoreCrudField,
  ): void {
    if (field && !field.name) {
      field.name = propertyKey;
    }

    Reflect.defineMetadata(
      FirestoreCrudMetadata.getMetadataKey(target.constructor, propertyKey),
      field || { name: propertyKey },
      target.constructor,
    );
  }

  public static findSchema(target: Function): FirestoreCrudSchema {
    return Reflect.getMetadata(FirestoreCrudMetadata.getMetadataKey(target), target);
  }

  public static findFields(target: Function): FirestoreCrudField[] {
    return Reflect.getMetadataKeys(target)
      .filter((key) => key.startsWith('firestore/') && key.includes('.'))
      .map((key) => Reflect.getMetadata(key, target));
  }
}
