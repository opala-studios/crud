import { Module } from '@nestjs/common';
import { KitsModule } from './kits/kits.module';
import { ConfigurationModule } from './shared/configuration/configuration.module';
import { FirestoreModule } from './shared/firestore';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    FirestoreModule.forRootAsync({
      imports: [ConfigurationModule],
      useFactory: (configService: ConfigService) => configService.get('firestore'),
      inject: [ConfigService]
    }),
    KitsModule
  ],
  providers: []
})
export class AppModule { }