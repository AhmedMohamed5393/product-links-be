import { TypeOrmModule } from "@nestjs/typeorm";
import { Module } from "@nestjs/common";
import { DynamicLinksController } from "./dynamic-links.controller";
import { DynamicLinksService } from "./dynamic-links.service";
import { DynamicLink } from "./entities/dynamic-links.entity";
import { DynamicLinkRepository } from "./repositories/dynamic-links.repository";
import { LoggingModule } from "@shared/modules/logging/logging.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([DynamicLink]),
    LoggingModule,
  ],
  controllers: [DynamicLinksController],
  providers: [
    DynamicLinksService,
    DynamicLinkRepository,
  ],
  exports: [],
})
export class DynamicLinkModule {}
