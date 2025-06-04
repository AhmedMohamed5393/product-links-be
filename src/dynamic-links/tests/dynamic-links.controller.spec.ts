import { Test, TestingModule } from '@nestjs/testing';
import { DynamicLinksController } from '../dynamic-links.controller';
import { DynamicLinksService } from '../dynamic-links.service';
import { CreateLinkDto } from '../dtos/create-link.dto';
import { SuccessClass } from 'src/shared/classes/success.class';
import { ProductEnum } from '../enums/product.enum';

describe('DynamicLinksController', () => {
  let controller: DynamicLinksController;
  let service: DynamicLinksService;

  const mockService = {
    generateLink: jest.fn(),
    resolve: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DynamicLinksController],
      providers: [
        {
          provide: DynamicLinksService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<DynamicLinksController>(DynamicLinksController);
    service = module.get<DynamicLinksService>(DynamicLinksService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /generate - createLink', () => {
    it('should return a SuccessClass with generated link', async () => {
      const dto: CreateLinkDto = {
        product: ProductEnum.PAYTALLY,
        originalUrl: 'https://paytally.com/payment/123',
        iosUrl: 'https://apps.apple.com/app/id123456789',
        androidUrl: 'https://play.google.com/store/apps/details?id=com.example.app',
        desktopUrl: 'https://fallback.example.com',
        iosAppStoreId: '123456789',
        androidPackageName: 'com.example.app',
        campaign: 'utm_source=google&utm_medium=cpc',
        param: 'any_custom_param',
        expiresAt: '2025-12-31T23:59:59.000Z',
      };

      const mockShortLink = 'https://short.ly/abc123';
      mockService.generateLink.mockResolvedValue(mockShortLink);

      const result = await controller.createLink(dto);

      expect(service.generateLink).toHaveBeenCalledWith(dto);
      expect(result).toBeInstanceOf(SuccessClass);
      expect(result.data).toEqual({ url: mockShortLink });
      expect(result.message).toBe('Link is generated successfully');
    });
  });

  describe('GET /:code - redirect', () => {
    it('should redirect to the resolved URL', async () => {
      const code = 'abc123';
      const resolvedUrl = 'https://paytally.com/payment/123';

      mockService.resolve.mockResolvedValue(resolvedUrl);

      const result = await controller.redirect(code);

      expect(service.resolve).toHaveBeenCalledWith(code);
      expect(result).toBeInstanceOf(SuccessClass);
      expect(result.data).toEqual({ url: resolvedUrl });
      expect(result.message).toBe('Link is resolved successfully');
    });
  });
});
