import { Injectable, NotFoundException } from "@nestjs/common";
import { LoggingService } from "../shared/modules/logging/logging.service";
import { CreateLinkDto } from "./dtos/create-link.dto";
import { DynamicLink } from "./entities/dynamic-links.entity";
import { generateShortCode } from "./utils/short-code-generator";
import { DynamicLinkRepository } from "./repositories/dynamic-links.repository";
import { RedisService } from "@shared/services/index.service";

@Injectable()
export class DynamicLinksService {
  constructor(
    private readonly redisService: RedisService,
    private readonly loggingService: LoggingService,
    private readonly repository: DynamicLinkRepository,
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

      // insert dynamic link data in the internal database
      const payload = { ...dto, shortCode } as unknown as DynamicLink;
      await this.repository.create(payload);

      await this.loggingService.createLog({
        title: `Generate a dynamic link`,
        action: `Generate a dynamic link for a product ${product}`,
        entity: 'DynamicLink',
      });
    } else {
      shortCode = existing.shortCode;
    }

    // create the generated dynamic short link
    return this.formatShortUrl(product, shortCode);
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

  private formatShortUrl(product: string, code: string): string {
    const domain = `https://${product}${process.env.SHORT_LINK_DOMAIN_PART}`;
    return `${domain}/${code}`;
  }
}
