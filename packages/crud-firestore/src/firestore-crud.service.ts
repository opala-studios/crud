import {
  CreateManyDto,
  CrudRequest,
  CrudRequestOptions,
  CrudService,
  GetManyDefaultResponse,
} from '@nestjsx/crud';

import {
  ClassType,
  hasLength,
  isArrayFull,
  isObject,
  isUndefined,
  objKeys,
  isNil,
  isNull,
  ObjectLiteral,
} from '@nestjsx/util';

import { FirestoreCrudRepository } from './firestore-crud.repository';

export abstract class FirestoreCrudService<T> extends CrudService<T> {
  constructor(protected readonly repository: FirestoreCrudRepository<T>) {
    super();
  }

  getMany(req: CrudRequest): Promise<GetManyDefaultResponse<T> | T[]> {
    throw new Error('Method not implemented.');
  }

  getOne(req: CrudRequest): Promise<T> {
    throw new Error('Method not implemented.');
  }

  async createOne(req: CrudRequest, dto: T): Promise<T> {
    const { returnShallow } = req.options.routes.createOneBase;

    let entity = this.prepareEntityBeforeSave(dto, req.parsed);

    if (!entity) {
      this.throwBadRequestException(`Empty data. Nothing to save.`);
    }

    const saved = await this.repository.createOne(entity);

    if (returnShallow) {
      return saved;
    } else {
      const primaryParam = this.getPrimaryParam(req.options);

      if (!primaryParam || isNil(saved[primaryParam])) {
        return saved;
      } else {
        req.parsed.paramsFilter = [
          {
            field: primaryParam,
            operator: '$eq',
            value: saved[primaryParam],
          },
        ];

        return await this.getOneOrFail(req);
      }
    }
  }

  createMany(req: CrudRequest, dto: CreateManyDto<any>): Promise<T[]> {
    throw new Error('Method not implemented.');
  }

  updateOne(req: CrudRequest, dto: T): Promise<T> {
    throw new Error('Method not implemented.');
  }

  replaceOne(req: CrudRequest, dto: T): Promise<T> {
    throw new Error('Method not implemented.');
  }

  deleteOne(req: CrudRequest): Promise<void | T> {
    throw new Error('Method not implemented.');
  }

  recoverOne(req: CrudRequest): Promise<void | T> {
    throw new Error('Method not implemented.');
  }

  protected async getOneOrFail(
    req: CrudRequest,
    shallow = false,
    withDeleted = false,
  ): Promise<T> {
    throw new Error('Method not implemented');
  }

  protected getPrimaryParam(options: CrudRequestOptions): string {
    const primaryParams = this.getPrimaryParams(options);
    if (primaryParams && primaryParams.length > 1) {
      this.throwBadRequestException('entity has more than one primary param defined');
    }

    return primaryParams[0];
  }

  protected prepareEntityBeforeSave(
    dto: Partial<T>,
    parsed: CrudRequest['parsed'],
  ): Partial<T> {
    /* istanbul ignore if */
    if (!isObject(dto)) {
      return undefined;
    }

    if (hasLength(parsed.paramsFilter)) {
      for (const filter of parsed.paramsFilter) {
        dto[filter.field] = filter.value;
      }
    }

    const authPersist = isObject(parsed.authPersist) ? parsed.authPersist : {};

    /* istanbul ignore if */
    if (!hasLength(objKeys(dto))) {
      return undefined;
    }

    return { ...dto, ...authPersist };
  }
}
