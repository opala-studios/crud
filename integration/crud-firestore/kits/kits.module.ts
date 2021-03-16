import { Module } from '@nestjs/common';
import { kitSchema } from './kit.schema';
import { FIRESTORE, KITS_REPOSITORY, KIT_SCHEMA } from './kits.constants';
import { KitsController } from './kits.controller';
import { KitsRepository } from './kits.repository';
import { KitsService } from './kits.service';

@Module({
  imports:[],
  controllers: [KitsController],
  providers: [
    KitsService,
    {
      provide: KIT_SCHEMA,
      useValue: kitSchema
    },
    {
      provide: FIRESTORE,
      useValue: {}
    },
    {
      provide: KITS_REPOSITORY,
      useClass: KitsRepository
    }
  ],
})
export class KitsModule {
}
