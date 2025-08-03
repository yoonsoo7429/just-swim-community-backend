import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
  Max,
} from 'class-validator';

export class CreateSwimmingDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(1)
  @Max(1000)
  duration: number;

  @IsNumber()
  @Min(1)
  @Max(10000)
  distance: number;

  @IsString()
  style: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  calories?: number;

  @IsOptional()
  @IsDateString()
  sessionDate?: string;

  @IsOptional()
  @IsNumber()
  userId?: number;
}
