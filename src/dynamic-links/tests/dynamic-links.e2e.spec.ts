import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, NotFoundException, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from 'src/app.module';
import { DynamicLinksService } from 'src/dynamic-links/dynamic-links.service';
import { ProductEnum } from 'src/dynamic-links/enums/product.enum';

describe('DynamicLinksController (e2e)', () => {
  let app: INestApplication;

  const mockService = {
    generateLink: jest.fn(),
    resolve: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DynamicLinksService)
      .useValue(mockService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/POST generate', () => {
    it('should return 201 and generated short link', async () => {
      const dto = {
        product: ProductEnum.PAYTALLY,
        originalUrl: 'https://paytally.com/payment/123',
      };

      const mockLink = 'https://short.ly/abc123';
      mockService.generateLink.mockResolvedValue(mockLink);

      const response = await request(app.getHttpServer())
        .post('/dynamic_links/generate')
        .send(dto)
        .expect(201);

      expect(response.body.data).toEqual({ url: mockLink });
      expect(response.body.message).toEqual('Link is generated successfully');
    });

    it('should return 400 for invalid URL', async () => {
      const dto = {
        product: ProductEnum.PAYTALLY,
        originalUrl: 'invalid-url',
      };

      const response = await request(app.getHttpServer())
        .post('/dynamic_links/generate')
        .send(dto)
        .expect(400);

      expect(response.body.message[0]).toContain('originalUrl must be a URL address');
    });
  });

  describe('/GET :code', () => {
    it('should redirect to resolved URL', async () => {
      const code = 'abc123';
      const resolvedUrl = 'https://paytally.com/payment/123';

      mockService.resolve.mockResolvedValue(resolvedUrl);

      const response = await request(app.getHttpServer())
        .get(`/dynamic_links/${code}`)
        .expect(200);

      expect(response.body.data).toStrictEqual({ url: resolvedUrl });
      expect(response.body.message).toEqual('Link is resolved successfully');
    });

    it('should return 404 if code not found', async () => {
      const code = 'notfound';

      mockService.resolve.mockRejectedValueOnce(new NotFoundException('Invalid or expired link'));

      const response = await request(app.getHttpServer())
        .get(`/dynamic_links/${code}`)
        .expect(404);

      expect(response.body.message).toBe('Invalid or expired link');
    });
  });
});
