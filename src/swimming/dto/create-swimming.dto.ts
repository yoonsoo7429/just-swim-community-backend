import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
  Max,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class StrokeDto {
  @IsString()
  style: string;

  @IsNumber()
  @Min(1)
  @Max(10000)
  distance: number;
}

export class CreateSwimmingDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(25)
  @Max(100)
  poolLength: number;

  @IsString()
  sessionStartTime: string;

  @IsString()
  sessionEndTime: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StrokeDto)
  strokes: StrokeDto[];

  @IsNumber()
  @Min(1)
  @Max(10000)
  totalDistance: number;

  @IsNumber()
  @Min(0.1)
  @Max(1000)
  totalDuration: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  calories?: number;

  @IsOptional()
  @IsDateString()
  sessionDate?: string;

  @IsNumber()
  userId: number;
}
