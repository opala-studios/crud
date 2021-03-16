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

    const saved = await this.repository.saveOne(entity);

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

  async createMany(req: CrudRequest, dto: CreateManyDto<any>): Promise<T[]> {
    if (!isObject(dto) || !isArrayFull(dto.bulk)) {
      this.throwBadRequestException(`Empty data. Nothing to save.`);
    }

    const bulk = dto.bulk
      .map((one) => this.prepareEntityBeforeSave(one, req.parsed))
      .filter((d) => !isUndefined(d));

    if (!hasLength(bulk)) {
      this.throwBadRequestException(`Empty data. Nothing to save.`);
    }

    return await this.repository.saveMany(bulk);
  }

  async updateOne(req: CrudRequest, dto: T): Promise<T> {
    const { allowParamsOverride, returnShallow } = req.options.routes.updateOneBase;
    const paramsFilters = this.getParamFilters(req.parsed);
    const found = await this.getOneOrFail(req, returnShallow);

    const toSave = !allowParamsOverride
      ? {
          ...found,
          ...dto,
          ...paramsFilters,
          ...req.parsed.authPersist,
        }
      : {
          ...found,
          ...dto,
          ...req.parsed.authPersist,
        };

    const updated = await this.repository.saveOne(toSave);

    if (returnShallow) {
      return updated;
    } else {
      req.parsed.paramsFilter.forEach((filter) => {
        filter.value = updated[filter.field];
      });

      return this.getOneOrFail(req);
    }
  }

  async replaceOne(req: CrudRequest, dto: T): Promise<T> {
    const { allowParamsOverride, returnShallow } = req.options.routes.replaceOneBase;
    const paramsFilters = this.getParamFilters(req.parsed);
    const found = await this.getOneOrFail(req, returnShallow);

    const toSave = !allowParamsOverride
      ? {
          ...(found || {}),
          ...dto,
          ...paramsFilters,
          ...req.parsed.authPersist,
        }
      : {
          ...(found || {}),
          ...paramsFilters,
          ...dto,
          ...req.parsed.authPersist,
        };

    const replaced = await this.repository.saveOne(toSave);

    if (returnShallow) {
      return replaced;
    } else {
      const primaryParam = this.getPrimaryParam(req.options);
      if (!primaryParam) {
        return replaced;
      } else {
        req.parsed.paramsFilter = [
          {
            field: primaryParam,
            operator: '$eq',
            value: replaced[primaryParam],
          },
        ];

        return this.getOneOrFail(req);
      }
    }
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

  protected getParamFilters(parsed: CrudRequest['parsed']): ObjectLiteral {
    let filters = {};
    if (hasLength(parsed.paramsFilter)) {
      for (const filter of parsed.paramsFilter) {
        filters[filter.field] = filter.value;
      }
    }

    return filters;
  }

  protected getPrimaryParam(options: CrudRequestOptions): string {
    const primaryParams = this.getPrimaryParams(options);
    if (primaryParams && primaryParams.length > 1) {
      this.throwBadRequestException('Entity has more than one primary param defined');
    }

    return primaryParams[0];
  }

  protected prepareEntityBeforeSave(
    dto: Partial<T>,
    parsed: CrudRequest['parsed'],
  ): Partial<T> {
    if (!isObject(dto)) {
      return undefined;
    }

    if (hasLength(parsed.paramsFilter)) {
      for (const filter of parsed.paramsFilter) {
        dto[filter.field] = filter.value;
      }
    }

    const authPersist = isObject(parsed.authPersist) ? parsed.authPersist : {};

    if (!hasLength(objKeys(dto))) {
      return undefined;
    }

    return { ...dto, ...authPersist };
  }
}
