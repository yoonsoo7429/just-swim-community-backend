import { IsOptional, IsDateString } from 'class-validator';

export class BaseDto {
  @IsOptional()
  @IsDateString()
  createdAt?: string;

  @IsOptional()
  @IsDateString()
  updatedAt?: string;
}
