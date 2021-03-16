import { CrudValidationGroups } from '@nestjsx/crud';
import { IsOptional, IsString } from 'class-validator';

const { CREATE, UPDATE } = CrudValidationGroups;

export class Kit {

  @IsString({ groups: [CREATE, UPDATE] })
  @IsOptional({ groups: [CREATE, UPDATE] })
  name?: string;

  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  isDeleted?: boolean;
}
