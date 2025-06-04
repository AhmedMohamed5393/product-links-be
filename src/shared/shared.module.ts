import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-ioredis';
import { dataSourceOptions } from '../../db/database.config';
import { RedisService } from './services/index.service';

@Global()
@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      store: redisStore,
      host: process.env.REDIS_HOST, // or your Docker Redis hostname
      port: +process.env.REDIS_PORT,
      ttl: 60, // default TTL in seconds
    }),
    TypeOrmModule.forRoot(dataSourceOptions),
  ],
  exports: [
    RedisService,
  ],
  providers: [
    RedisService,
  ],
})
export class SharedModule {}
