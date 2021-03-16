import { ModuleMetadata, Type } from '@nestjs/common';
import { Settings } from '@google-cloud/firestore';

export interface FirestoreModuleOptions extends Settings, Record<string, any> { }

export interface FirestoreModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<FirestoreOptionsFactory>;
  useClass?: Type<FirestoreOptionsFactory>;
  useFactory?: (
    ...args: any[]
  ) =>
    | Promise<FirestoreModuleOptions>
    | FirestoreModuleOptions;
  inject?: any[];
}

export interface FirestoreOptionsFactory {
  createFirestoreCredentials():
    | Promise<FirestoreModuleOptions>
    | FirestoreModuleOptions;
}
