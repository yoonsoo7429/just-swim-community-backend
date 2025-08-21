import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsArray,
  IsNumber,
  IsDate,
} from 'class-validator';
import { PostCategory } from '../entities/post.entity';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsEnum(PostCategory)
  category: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  // 훈련 모집 관련 필드들
  @IsOptional()
  @IsNumber()
  trainingProgramId?: number;

  @IsOptional()
  @IsString()
  recruitmentType?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  meetingDays?: string[];

  @IsOptional()
  @IsString()
  meetingTime?: string;

  @IsOptional()
  @IsDate()
  meetingDateTime?: Date;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsNumber()
  maxParticipants?: number;

  @IsOptional()
  @IsNumber()
  currentParticipants?: number;

  @IsOptional()
  @IsString()
  recruitmentStatus?: string;
}
