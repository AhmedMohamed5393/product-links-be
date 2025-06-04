import { Base } from "@shared/entities/base.entity";
import { Entity, Column } from "typeorm";

@Entity('dynamic_links')
export class DynamicLink extends Base {
  @Column()
  product: string;

  @Column({ unique: true })
  shortCode: string;

  @Column()
  originalUrl: string;

  @Column({ nullable: true })
  iosUrl: string;

  @Column({ nullable: true })
  androidUrl: string;

  @Column({ nullable: true })
  desktopUrl: string;

  @Column({ nullable: true })
  iosAppStoreId: string;

  @Column({ nullable: true })
  androidPackageName: string;

  @Column({ nullable: true })
  campaign: string;

  @Column({ nullable: true })
  param: string;

  @Column({ default: 0 })
  clickCount: number;

  @Column({ nullable: true, type: 'datetime' })
  expiresAt: Date;
}
