import { RedisService } from '../services/redis.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test, TestingModule } from '@nestjs/testing';

describe('RedisService', () => {
  let service: RedisService;
  let cacheManager: {
    get: jest.Mock;
    set: jest.Mock;
    del: jest.Mock;
  };

  beforeEach(async () => {
    cacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: CACHE_MANAGER,
          useValue: cacheManager,
        },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
  });

  it('should get value from cache', async () => {
    const key = 'test_key';
    const value = 'test_value';
    cacheManager.get.mockResolvedValue(value);

    const result = await service.get<string>(key);

    expect(cacheManager.get).toHaveBeenCalledWith(key);
    expect(result).toBe(value);
  });

  it('should set value in cache', async () => {
    const key = 'test_key';
    const value = { name: 'Ahmed' };
    const ttl = 60;

    await service.set(key, value, ttl);

    expect(cacheManager.set).toHaveBeenCalledWith(key, value, ttl);
  });

  it('should delete value from cache', async () => {
    const key = 'test_key';

    await service.del(key);

    expect(cacheManager.del).toHaveBeenCalledWith(key);
  });
});
