import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ILike } from 'typeorm';
import { PageOptionsDto } from 'src/shared/pagination/pageOption.dto';
import { PageMetaDto } from 'src/shared/pagination/page-meta.dto';
import { Log } from './entities/log.entity';

@Injectable()
export class LoggingService {
  constructor(
    @InjectRepository(Log)
    private logRepository: Repository<Log>,
  ) {}

  async createLog(log: Partial<Log>): Promise<Log> {
    const newLog = this.logRepository.create(log);
    return this.logRepository.save(newLog);
  }

  async findAll(pageOptionsDto: PageOptionsDto) {
    const skip = (pageOptionsDto.page - 1) * pageOptionsDto.take || 0;

    let search = {};
    if (pageOptionsDto.search) {
      search = [
        { message: ILike(`%${pageOptionsDto.search}%`) }, // Adjust the field names based on your entity
        { details: ILike(`%${pageOptionsDto.search}%`) },
      ];
    }

    const [logs, total] = await this.logRepository.findAndCount({
      take: pageOptionsDto.take,
      skip,
      where: search,
      order: { created_at: 'DESC' },
    });

    const pageMetaDto = new PageMetaDto({
      itemsPerPage: logs.length,
      total,
      pageOptionsDto,
    });

    return { meta: pageMetaDto, logs };
  }
}
