import { Controller, Get, Query } from '@nestjs/common';
import { LoggingService } from './logging.service';
import { PageOptionsDto } from 'src/shared/pagination/pageOption.dto';

@Controller('logs')
export class LoggingController {
  constructor(private readonly logService: LoggingService) {}

  @Get()
  findAll(@Query() pageOptionsDto: PageOptionsDto) {
    return this.logService.findAll(pageOptionsDto);
  }
}
