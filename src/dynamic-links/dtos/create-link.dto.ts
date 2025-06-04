import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUrl, IsDateString } from 'class-validator';
import { ProductEnum } from '../enums/product.enum';

export class CreateLinkDto {
  @ApiProperty({ enum: ProductEnum, example: ProductEnum.PAYTALLY })
  @IsEnum(ProductEnum)
  product: string;

  @ApiProperty({ example: 'https://paytally.com/payment/123' })
  @IsUrl()
  originalUrl: string;

  @ApiPropertyOptional({ example: 'https://apps.apple.com/app/id123456789' })
  @IsOptional()
  @IsUrl()
  iosUrl?: string;

  @ApiPropertyOptional({ example: 'https://play.google.com/store/apps/details?id=com.example.app' })
  @IsOptional()
  @IsUrl()
  androidUrl?: string;

  @ApiPropertyOptional({ example: 'https://fallback.example.com' })
  @IsOptional()
  @IsUrl()
  desktopUrl?: string;

  @ApiPropertyOptional({ example: '123456789' })
  @IsOptional()
  iosAppStoreId?: string;

  @ApiPropertyOptional({ example: 'com.example.app' })
  @IsOptional()
  androidPackageName?: string;

  @ApiPropertyOptional({ example: 'utm_source=google&utm_medium=cpc' })
  @IsOptional()
  campaign?: string;

  @ApiPropertyOptional({ example: 'any_custom_param' })
  @IsOptional()
  param?: string;

  @ApiPropertyOptional({ example: '2025-12-31T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
