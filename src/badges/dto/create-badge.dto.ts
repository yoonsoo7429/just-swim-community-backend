import { IsString, IsOptional, IsInt, IsBoolean, IsIn } from 'class-validator';

export class CreateBadgeDto {
  @IsString()
  key: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  icon: string;

  @IsOptional()
  @IsIn(['bronze', 'silver', 'gold', 'platinum'])
  tier?: string;

  @IsString()
  category: string;

  @IsOptional()
  criteria?: any;

  @IsOptional()
  @IsInt()
  points?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
