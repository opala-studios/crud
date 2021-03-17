import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Crud } from '@nestjsx/crud';
import { Kit } from './kit.entity';
import { KitsService } from './kits.service';

@Crud({
  model: {
    type: Kit,
  },
  params: {
    id: {
      field: 'id',
      type: 'string',
      primary: true,
    },
  }
})
@ApiTags('kits')
@Controller('kits')
export class KitsController {
  constructor(public service: KitsService) { }
}
