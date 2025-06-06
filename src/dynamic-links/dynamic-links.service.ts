import { Injectable, Inject, NotFoundException } from "@nestjs/common";
import { LoggingService } from "../shared/logging/logging.service";
import { CreateLinkDto } from "./dtos/create-link.dto";
import { DynamicLink } from "./entities/dynamic-links.entity";
import {
    DYNAMIC_LINK_CONFIG,
    DynamicLinkModuleConfig,
} from "./interfaces/dynamic-link-config.interface";
import { generateShortCode } from "./utils/short-code-generator";
import { DynamicLinkRepository } from "./repositories/dynamic-links.repository";
import { RedisService } from "@shared/services/index.service";

@Injectable()
export class DynamicLinksService {
  constructor(
    private readonly redisService: RedisService,
    private readonly loggingService: LoggingService,
    private readonly repository: DynamicLinkRepository,
    @Inject(DYNAMIC_LINK_CONFIG)
    private readonly config: DynamicLinkModuleConfig,
  ) {}

  public async generateLink(dto: CreateLinkDto): Promise<string> {
    const { product, originalUrl } = dto;

    let shortCode: string;
    const existing = await this.repository.findOne({
      where: { product, originalUrl },
      select: { id: true, shortCode: true },
    });
    if (!existing) {
      shortCode = generateShortCode();

      const payload = { ...dto, shortCode } as unknown as DynamicLink;
      await this.repository.create(payload);

      await this.loggingService.createLog({
        title: `Generate a dynamic link`,
        action: `Generate a dynamic link for a product ${dto.product}`,
        entity: 'DynamicLink',
      });
    } else {
      shortCode = existing.shortCode;
    }

    return this.formatShortUrl(originalUrl, shortCode);
  }

  public async resolve(shortCode: string): Promise<string> {
    // check cache
    const cached = await this.redisService.get<string>(`short:${shortCode}`);
    if (cached) return cached;

    const link = await this.repository.findOne({
      where: { shortCode },
      select: { id: true, expiresAt: true, clickCount: true, originalUrl: true },
    });
    if (!link || (link.expiresAt && new Date() > link.expiresAt)) {
      throw new NotFoundException('Invalid or expired link');
    }

    link.clickCount += 1;
    await this.repository.save(link);

    const finalUrl = link.originalUrl;
    await this.redisService.set(`short:${shortCode}`, finalUrl, +process.env.REDIS_TTL || 3600); // cache for 1hr

    return finalUrl;
  }

  private formatShortUrl(originalUrl: string, code: string): string {
    const domain = `${originalUrl.split('.')[0]}.page.link`;
    return `${domain}/${code}?d=1`;
  }
}
