import { TypeOrmModule } from "@nestjs/typeorm";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DynamicLinksController } from "./dynamic-links.controller";
import { DynamicLinksService } from "./dynamic-links.service";
import { DynamicLink } from "./entities/dynamic-links.entity";
import { DynamicLinkRepository } from "./repositories/dynamic-links.repository";
import { LoggingModule } from "@shared/logging/logging.module";
import { dynamicLinkConfig, DynamicLinkConfigProvider } from "./config/dynamic-links.config";

@Module({
  imports: [
    TypeOrmModule.forFeature([DynamicLink]),
    LoggingModule,
    ConfigModule.forRoot({ load: [dynamicLinkConfig], isGlobal: true }),
  ],
  controllers: [DynamicLinksController],
  providers: [
    DynamicLinksService,
    DynamicLinkRepository,
    DynamicLinkConfigProvider,
  ],
  exports: [],
})
export class DynamicLinkModule {}
