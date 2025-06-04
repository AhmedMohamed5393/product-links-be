import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from 'src/shared/repositories/base.repository';
import { DynamicLink } from '../entities/dynamic-links.entity';
import { DynamicLinkRepositoryInterface } from './interfaces/dynamic-links.repository.interface';

@Injectable()
export class DynamicLinkRepository
  extends BaseRepository<DynamicLink>
  implements DynamicLinkRepositoryInterface
{
  constructor(@InjectRepository(DynamicLink) dynamicLinkRepository: Repository<DynamicLink>) {
    super(dynamicLinkRepository);
  }
}
