import { Test, TestingModule } from '@nestjs/testing';
import { DynamicLinksService } from '../dynamic-links.service';
import { RedisService } from '../../shared/services/redis.service';
import { LoggingService } from '../../shared/modules/logging/logging.service';
import { DynamicLinkRepository } from '../repositories/dynamic-links.repository';
import { CreateLinkDto } from '../dtos/create-link.dto';
import { NotFoundException } from '@nestjs/common';
import { DYNAMIC_LINK_CONFIG } from '../interfaces/dynamic-link-config.interface';

const mockRedisService = {
  get: jest.fn(),
  set: jest.fn(),
};

const mockLoggingService = {
  createLog: jest.fn(),
};

const mockRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

const mockConfig = {
  products: [
    { product: 'PAYTALLY', domain: 'https://paytally.link' },
  ],
};

describe('DynamicLinksService', () => {
  let service: DynamicLinksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DynamicLinksService,
        { provide: RedisService, useValue: mockRedisService },
        { provide: LoggingService, useValue: mockLoggingService },
        { provide: DynamicLinkRepository, useValue: mockRepository },
        { provide: DYNAMIC_LINK_CONFIG, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<DynamicLinksService>(DynamicLinksService);

    jest.clearAllMocks();
  });

  describe('generateLink', () => {
    it('should return existing shortCode if found', async () => {
      const dto: CreateLinkDto = {
        product: 'PAYTALLY',
        originalUrl: 'https://paytally.com/payment/123',
      };

      mockRepository.findOne.mockResolvedValue({ shortCode: 'abc123' });

      const result = await service.generateLink(dto);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { product: dto.product, originalUrl: dto.originalUrl },
        select: { id: true, shortCode: true },
      });

      expect(result).toBe('https://paytally.link/abc123?d=1');
    });

    it('should generate new shortCode and save it', async () => {
      const dto: CreateLinkDto = {
        product: 'PAYTALLY',
        originalUrl: 'https://paytally.com/payment/123',
      };

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(undefined); // assume successful
      const logSpy = jest.spyOn(mockLoggingService, 'createLog');

      const result = await service.generateLink(dto);

      expect(mockRepository.create).toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalled();
      expect(result).toMatch(/https:\/\/paytally\.link\/\w+\?d=1/);
    });
  });

  describe('resolve', () => {
    const shortCode = 'abc123';

    it('should return cached value if exists', async () => {
      mockRedisService.get.mockResolvedValue('https://cached-url.com');

      const result = await service.resolve(shortCode);

      expect(mockRedisService.get).toHaveBeenCalledWith(`short:${shortCode}`);
      expect(result).toBe('https://cached-url.com');
    });

    it('should throw NotFoundException if link not found', async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.resolve(shortCode)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if link is expired', async () => {
      const expiredLink = {
        originalUrl: 'https://expired.com',
        expiresAt: new Date(Date.now() - 1000),
      };

      mockRedisService.get.mockResolvedValue(null);
      mockRepository.findOne.mockResolvedValue(expiredLink);

      await expect(service.resolve(shortCode)).rejects.toThrow(NotFoundException);
    });

    it('should increment clickCount and return originalUrl', async () => {
      const validLink = {
        id: '1',
        originalUrl: 'https://valid.com',
        clickCount: 0,
        expiresAt: null,
      };

      mockRedisService.get.mockResolvedValue(null);
      mockRepository.findOne.mockResolvedValue(validLink);
      mockRepository.save.mockResolvedValue(undefined);
      mockRedisService.set.mockResolvedValue(undefined);

      const result = await service.resolve(shortCode);

      expect(validLink.clickCount).toBe(1);
      expect(mockRepository.save).toHaveBeenCalledWith(validLink);
      expect(mockRedisService.set).toHaveBeenCalledWith(
        `short:${shortCode}`,
        'https://valid.com',
        expect.any(Number),
      );
      expect(result).toBe('https://valid.com');
    });
  });
});
