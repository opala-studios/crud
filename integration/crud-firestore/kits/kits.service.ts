import { Inject, Injectable } from '@nestjs/common';
import { FirestoreCrudService } from '@opala-studios/crud-firestore';
import { Kit } from './kit.entity';
import { KITS_REPOSITORY } from './kits.constants';
import { KitsRepository } from './kits.repository';

@Injectable()
export class KitsService extends FirestoreCrudService<Kit> {

  constructor(
    @Inject(KITS_REPOSITORY) kitsRepository: KitsRepository
  ) {
    super(kitsRepository);
  }
}
