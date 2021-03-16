import {
  CollectionReference,
  DocumentData,
  FieldPath,
  Query,
} from '@google-cloud/firestore';
import {
  CreateManyDto,
  CrudRequest,
  CrudRequestOptions,
  CrudService,
  GetManyDefaultResponse,
  QueryOptions,
} from '@nestjsx/crud';
import { ParsedRequestParams, QuerySort } from '@nestjsx/crud-request';

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
  protected readonly queryFilterOperatorsMap = {
    $eq: '==',
    $ne: '!=',
    $gt: '>',
    $lt: '<',
    $gte: '>=',
    $lte: '<=',
    $in: 'in',
    $notin: 'not-in',
  };

  protected collectionFields: string[];

  constructor(protected readonly repository: FirestoreCrudRepository<T>) {
    super();

    this.collectionFields = this.repository.schema.fields.map((field) => field.name);
  }

  async countMany(req: CrudRequest): Promise<Number> {
    const { parsed, options } = req;
    const query = await this.buildQuery(parsed, options, false);
    return this.repository.count(query);
  }

  async getMany(req: CrudRequest): Promise<GetManyDefaultResponse<T> | T[]> {
    const { parsed, options } = req;
    const query = await this.buildQuery(parsed, options);
    return this.repository.find(query);
  }

  async getOne(req: CrudRequest): Promise<T> {
    return this.getOneOrFail(req);
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

    return await this.repository.createMany(bulk);
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

  async deleteOne(req: CrudRequest): Promise<void | T> {
    const { returnDeleted } = req.options.routes.deleteOneBase;
    const found = await this.getOneOrFail(req, returnDeleted);
    const toReturn = returnDeleted ? found : undefined;

    const primaryParam = this.getPrimaryParam(req.options);
    await this.repository.removeOne(found[primaryParam], {
      softDelete: req.options.query.softDelete,
    });

    return toReturn;
  }

  async recoverOne(req: CrudRequest): Promise<void | T> {
    const found = await this.getOneOrFail(req, true, true);
    const primaryParam = this.getPrimaryParam(req.options);
    return this.repository.recoverOne(found[primaryParam]);
  }

  protected async getOneOrFail(
    req: CrudRequest,
    shallow = false,
    withDeleted = false,
  ): Promise<T> {
    const { parsed, options } = req;

    let query: Query<DocumentData> = shallow
      ? this.repository.buildQuery(withDeleted)
      : await this.buildQuery(parsed, options, true, withDeleted);

    if (shallow) {
      query = this.getDefaultSearchCondition(query, parsed, options);
    }

    const finded = await this.repository.find(query);

    if (!finded.length) {
      this.throwNotFoundException(this.repository.schema.collection);
    }

    return finded[0];
  }

  protected async buildQuery(
    parsed: ParsedRequestParams,
    options: CrudRequestOptions,
    many = true,
    withDeleted = false,
  ): Promise<Query<DocumentData>> {
    const onlyThoseNotDeleted =
      options.query.softDelete && parsed.includeDeleted !== 1 && !withDeleted;
    let query = this.repository.buildQuery(onlyThoseNotDeleted);
    query = this.getDefaultSearchCondition(query, parsed, options);
    query = this.selectFields(query, parsed, options);

    if (many) {
      const sort = this.getSort(parsed, options.query);
      Object.keys(sort).forEach((key) => {
        query = query.orderBy(key, sort[key]);
      });

      const take = this.getTake(parsed, options.query);
      if (take && isFinite(take)) {
        query = query.limit(take);
      }

      const skip = this.getSkip(parsed, take);
      if (skip && isFinite(skip)) {
        query = query.offset(skip);
      }
    }

    return query;
  }

  protected getDefaultSearchCondition(
    query: Query<DocumentData>,
    parsed: ParsedRequestParams,
    options: CrudRequestOptions,
  ): Query<DocumentData> | CollectionReference<DocumentData> {
    const filters = isArrayFull(options.query.filter)
      ? [...(options.query.filter as []), ...parsed.paramsFilter, ...parsed.filter]
      : [...parsed.paramsFilter, ...parsed.filter];

    const primaryParam = this.getPrimaryParam(options);

    filters.forEach((filter) => {
      const field = filter.field === primaryParam ? FieldPath.documentId() : filter.field;
      const operator = this.queryFilterOperatorsMap[filter.operator];
      const value = filter.value;

      query = query.where(field, operator, value);
    });

    return query;
  }

  protected selectFields(
    query: Query<DocumentData>,
    parsed: ParsedRequestParams,
    options: CrudRequestOptions,
  ): Query<DocumentData> {
    const select = this.getSelect(parsed, options.query);
    return query.select(...select);
  }

  protected getSelect(query: ParsedRequestParams, options: QueryOptions): string[] {
    const allowed = this.getAllowedFields(this.collectionFields, options);

    const fields =
      query.fields && query.fields.length
        ? query.fields.filter((field) => allowed.some((f) => f === field))
        : allowed;

    const select = [
      ...(options.persist && options.persist.length ? options.persist : []),
      ...fields,
    ];

    return select;
  }

  protected getAllowedFields(fields: string[], options: QueryOptions): string[] {
    return (!options.exclude || !options.exclude.length) &&
      (!options.allow || !options.allow.length)
      ? fields
      : fields.filter(
          (field) =>
            (options.exclude && options.exclude.length
              ? !options.exclude.some((f) => f === field)
              : true) &&
            (options.allow && options.allow.length
              ? options.allow.some((f) => f === field)
              : true),
        );
  }

  protected getSort(query: ParsedRequestParams, options: QueryOptions) {
    return query.sort && query.sort.length
      ? this.mapSort(query.sort)
      : options.sort && options.sort.length
      ? this.mapSort(options.sort)
      : {};
  }

  private mapSort(sort: QuerySort[]) {
    const params: ObjectLiteral = {};

    for (let i = 0; i < sort.length; i++) {
      params[sort[i].field] = sort[i].order.toLowerCase();
    }

    return params;
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
