import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configOptions } from './configuration.options';

@Module({
    imports: [ConfigModule.forRoot(configOptions)],
    exports: [ConfigModule]
})
export class ConfigurationModule { }
