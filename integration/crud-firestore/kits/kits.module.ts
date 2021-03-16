import { Module } from '@nestjs/common';
import { FirestoreModule } from '../shared/firestore';
import { kitSchema } from './kit.schema';
import { KITS_REPOSITORY, KIT_SCHEMA } from './kits.constants';
import { KitsController } from './kits.controller';
import { KitsRepository } from './kits.repository';
import { KitsService } from './kits.service';

@Module({
  imports:[FirestoreModule],
  controllers: [KitsController],
  providers: [
    KitsService,
    {
      provide: KIT_SCHEMA,
      useValue: kitSchema
    },
    {
      provide: KITS_REPOSITORY,
      useClass: KitsRepository
    }
  ],
})
export class KitsModule {
}
