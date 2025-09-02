import {
  IsEnum,
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsArray,
} from 'class-validator';
import { ChallengeType, ChallengeCategory } from '../entities/challenge.entity';

export class CreateChallengeDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsEnum(ChallengeType)
  type: ChallengeType;

  @IsEnum(ChallengeCategory)
  category: ChallengeCategory;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsNumber()
  targetValue: number;

  @IsString()
  unit: string;

  @IsOptional()
  @IsNumber()
  maxParticipants?: number;

  @IsOptional()
  rules?: any;

  @IsOptional()
  metadata?: any;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsString()
  bannerImage?: string;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  invitedUserIds?: number[]; // 초대할 사용자 ID 목록
}
