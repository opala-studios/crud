import { Module } from '@nestjs/common';
import { FirestoreModule } from '../shared/firestore';
import { KITS_REPOSITORY } from './kits.constants';
import { KitsController } from './kits.controller';
import { KitsRepository } from './kits.repository';
import { KitsService } from './kits.service';

@Module({
  imports: [FirestoreModule],
  controllers: [KitsController],
  providers: [
    KitsService,
    {
      provide: KITS_REPOSITORY,
      useClass: KitsRepository,
    },
  ],
})
export class KitsModule {}
