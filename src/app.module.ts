import { Module } from '@nestjs/common'; 
import { SharedModule } from './shared/shared.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DynamicLinkModule } from './dynamic-links/dynamic-links.module';

@Module({
  imports: [
    SharedModule,
    DynamicLinkModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
