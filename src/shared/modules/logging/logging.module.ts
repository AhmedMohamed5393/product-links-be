import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggingService } from './logging.service';
import { Log } from './entities/log.entity';
import { LoggingController } from './logging.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Log])],
  controllers: [LoggingController],
  providers: [LoggingService],
  exports: [LoggingService],
})
export class LoggingModule {}
