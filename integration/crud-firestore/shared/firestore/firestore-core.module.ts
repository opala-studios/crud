import { DynamicModule, Global, Module, Provider, Type } from '@nestjs/common';
import {
  FIRESTORE,
  FIRESTORE_SETTINGS
} from './firestore.constants';

import {
  FirestoreModuleOptions,
  FirestoreModuleAsyncOptions,
  FirestoreOptionsFactory,
} from './interfaces/firestore-options.interface';
import { Firestore, Settings } from '@google-cloud/firestore';

@Global()
@Module({})
export class FirestoreCoreModule {
  static forRoot(options: FirestoreModuleOptions = {}): DynamicModule {
    const firestoreProvider = {
      provide: FIRESTORE,
      useFactory: () => {
        return new Firestore(options);
      },
    };

    return {
      module: FirestoreCoreModule,
      providers: [firestoreProvider],
      exports: [firestoreProvider],
    };
  }

  static forRootAsync(options: FirestoreModuleAsyncOptions): DynamicModule {
    const firestoreProvider = {
      provide: FIRESTORE,
      useFactory: (settings: Settings) => new Firestore(settings),
      inject: [FIRESTORE_SETTINGS],
    };

    const asyncProviders = this.createAsyncProviders(options);

    return {
      module: FirestoreCoreModule,
      imports: options.imports,
      providers: [...asyncProviders, firestoreProvider],
      exports: [firestoreProvider],
    };
  }

  private static createAsyncProviders(options: FirestoreModuleAsyncOptions): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options)];
    }
    const useClass = options.useClass as Type<FirestoreOptionsFactory>;
    return [
      this.createAsyncOptionsProvider(options),
      {
        provide: useClass,
        useClass,
      },
    ];
  }

  private static createAsyncOptionsProvider(
    options: FirestoreModuleAsyncOptions,
  ): Provider {
    if (options.useFactory) {
      return {
        provide: FIRESTORE_SETTINGS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }
    // `as Type<FirestoreOptionsFactory>` is a workaround for microsoft/TypeScript#31603
    const inject = [
      (options.useClass || options.useExisting) as Type<FirestoreOptionsFactory>,
    ];
    return {
      provide: FIRESTORE_SETTINGS,
      useFactory: async (optionsFactory: FirestoreOptionsFactory) =>
        await optionsFactory.createFirestoreCredentials(),
      inject,
    };
  }
}
