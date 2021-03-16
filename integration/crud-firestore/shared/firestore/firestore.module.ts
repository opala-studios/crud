import { DynamicModule, Module } from '@nestjs/common';
import { FirestoreCoreModule } from './firestore-core.module';

import {
  FirestoreModuleAsyncOptions,
  FirestoreModuleOptions,
} from './interfaces/firestore-options.interface';

@Module({})
export class FirestoreModule {
  static forRoot(options: FirestoreModuleOptions = {}): DynamicModule {
    return {
      module: FirestoreModule,
      imports: [FirestoreCoreModule.forRoot(options)],
    };
  }

  static forRootAsync(options: FirestoreModuleAsyncOptions): DynamicModule {
    return {
      module: FirestoreModule,
      imports: [FirestoreCoreModule.forRootAsync(options)],
    };
  }
}
