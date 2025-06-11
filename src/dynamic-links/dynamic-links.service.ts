import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { LoggingService } from "../shared/modules/logging/logging.service";
import { CreateLinkDto } from "./dtos/create-link.dto";
import { DynamicLink } from "./entities/dynamic-links.entity";
import { generateShortCode } from "./utils/short-code-generator";
import { DynamicLinkRepository } from "./repositories/dynamic-links.repository";
import { RedisService } from "@shared/services/index.service";
import { DeepLinkInterface } from "./interfaces/deep-link.interface";
import * as useragent from 'useragent';

@Injectable()
export class DynamicLinksService {
  private readonly logger = new Logger(DynamicLinksService.name);

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

  public async resolve(shortCode: string, debug?: string, userAgentString = '', json = ''): Promise<any> {
    // check cache
    const cached = await this.redisService.get<string>(`short:${shortCode}`);
    if (cached) return cached;

    // fetch the link by code with validation
    const link = await this.findOneAndCheckValidityByCode(shortCode);

    // update click counter of the link
    await this.updateClickCount(link);

    // 🎯 Construct the redirect URL based on platform
    const redirectUrl = this.getRedirectUrl(link, userAgentString);

    const { originalUrl, param, expiresAt, product } = link;

    // concatenate original url with the param
    const previewUrl = [originalUrl, param].join('?');
    
    // if no debug value passed then returned to final url concatenated with query param of fetched link
    if (debug !== '1') {
      // cache for 1hr
      await this.redisService.set(`short:${shortCode}`, originalUrl, +process.env.REDIS_TTL || 3600);

      return previewUrl;
    }

    if (json !== '1') {
      return `/public/preview.html?code=${shortCode}&originalUrl=${encodeURIComponent(link.originalUrl)}&iosUrl=${link.iosUrl}&iosAppStoreId=${link.iosAppStoreId}&androidUrl=${link.androidUrl}&androidPackageName=${link.androidPackageName}&desktopUrl=${link.desktopUrl}`;
    }

    return {
      shortLink: this.formatShortUrl(product, shortCode),
      previewLink: previewUrl,
      platformRedirect: redirectUrl,
      analyticsInfo: {
        code: shortCode,
        totalClicks: link.clickCount,
        expiresAt: expiresAt,
      },
      status: new Date() > (expiresAt || new Date(0)) ? 'expired' : 'active',
      warning: !param ? undefined : 'This link has attached query params',
    };
  }

  private async updateClickCount(link: DynamicLink) {
    link.clickCount += 1;
    await this.repository.save(link);
  }

  private async findOneAndCheckValidityByCode(shortCode: string) {
    const link = await this.repository.findOne({ where: { shortCode } });
    if (!link || (link.expiresAt && new Date() > link.expiresAt)) {
      throw new NotFoundException('Invalid or expired link');
    }

    return link;
  }

  private getRedirectUrl(link: DeepLinkInterface, userAgentString: string): string {
    const agent = useragent.parse(userAgentString);
    let redirectUrl = link.originalUrl;

    this.logger.debug(`Getting redirection URL for: ${JSON.stringify(link)} with agent [${agent.toString()}]`);

    if (agent.os.family === 'iOS') {
      if (link.iosUrl) {
        redirectUrl = link.iosUrl;
      } else if (link.iosAppStoreId) {
        redirectUrl = `https://apps.apple.com/app/id${link.iosAppStoreId}`;
      }
    } else if (agent.os.family === 'Android') {
      if (link.androidUrl) {
        redirectUrl = link.androidUrl;
      } else if (link.androidPackageName) {
        redirectUrl = `https://play.google.com/store/apps/details?id=${link.androidPackageName}`;
      }
    } else if (link.desktopUrl) {
      redirectUrl = link.desktopUrl;
    }

    this.logger.debug(`Redirection URL is: [${redirectUrl}]`);
    return redirectUrl;
  }

  private formatShortUrl(product: string, code: string): string {
    const domain = `https://${product}${process.env.SHORT_LINK_DOMAIN_PART}`;
    return `${domain}/${code}`;
  }
}
