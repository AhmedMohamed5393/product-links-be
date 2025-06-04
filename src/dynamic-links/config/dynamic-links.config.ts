import { ConfigService } from '@nestjs/config';
import { Provider } from '@nestjs/common';
import { DYNAMIC_LINK_CONFIG, DynamicLinkModuleConfig } from '../interfaces/dynamic-link-config.interface';

export const DynamicLinkConfigProvider: Provider = {
  provide: DYNAMIC_LINK_CONFIG,
  useFactory: (configService: ConfigService): DynamicLinkModuleConfig => {
    const products = configService.get('DYNAMIC_LINK_PRODUCTS');

    if (!products || !Array.isArray(products)) {
      throw new Error('DYNAMIC_LINK_PRODUCTS is not defined or not an array in configuration');
    }

    return { products };
  },
  inject: [ConfigService],
};

export const dynamicLinkConfig = () => ({
  DYNAMIC_LINK_PRODUCTS: JSON.parse(process.env.DYNAMIC_LINK_PRODUCTS || '[]'),
});
