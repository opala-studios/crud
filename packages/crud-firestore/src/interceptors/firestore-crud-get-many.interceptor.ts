import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { FirestoreCrudService } from '@opala-studios/crud-firestore';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';

const PARSED_CRUD_REQUEST_KEY = 'NESTJSX_PARSED_CRUD_REQUEST_KEY';

export abstract class FirestoreCrudGetManyInterceptor<T> implements NestInterceptor {
  constructor(private readonly service: FirestoreCrudService<T>) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Promise<Observable<any>> {
    const argumentsHost = context.switchToHttp();
    const request = argumentsHost.getRequest<Request>();
    const response = argumentsHost.getResponse<Response>();

    const crudRequest = request[PARSED_CRUD_REQUEST_KEY];
    const count = await this.service.countMany(crudRequest);

    response.set('Total-Count', count.toString());

    return next.handle();
  }
}
