export interface DynamicLinkProductConfig {
  product: string;
  domain: string;
  fallbackUrl: string;
}

export interface DynamicLinkModuleConfig {
  products: DynamicLinkProductConfig[];
}

export const DYNAMIC_LINK_CONFIG = 'DYNAMIC_LINK_CONFIG';
