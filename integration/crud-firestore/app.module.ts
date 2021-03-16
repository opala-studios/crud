import { Module } from '@nestjs/common';
import { KitsModule } from './kits/kits.module';

@Module({
  imports: [
    KitsModule
  ],
  providers: []
})
export class AppModule {
}
