import { CrudValidationGroups } from '@nestjsx/crud';
import { Field, Schema } from '@opala-studios/crud-firestore';
import { Transform, Type } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

const { CREATE, UPDATE } = CrudValidationGroups;

@Schema({ collection: 'kits', timestamp: true, softDelete: true })
export class Kit {
  @Field({ isId: true })
  @Type(() => String)
  id?: string;

  @IsString({ groups: [CREATE, UPDATE] })
  @IsOptional({ groups: [CREATE, UPDATE] })
  @Field()
  @Type(() => String)
  name?: string;

  @Field()
  @Type(() => Date)
  createdAt?: Date;

  @Field()
  @Type(() => Date)
  updatedAt?: Date;

  @Field()
  @Type(() => Boolean)
  isDeleted?: boolean;
}
