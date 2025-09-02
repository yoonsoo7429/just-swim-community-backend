import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsArray,
  IsNumber,
  IsDate,
  Min,
  Max,
} from 'class-validator';
import { PostCategory } from '../entities/post.entity';
import { IsInt } from 'class-validator';

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

  // 챌린지 카테고리일 때 선택적으로 연결할 실제 챌린지 ID
  @IsOptional()
  @IsInt()
  challengeId?: number;

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
  @Min(0)
  @Max(99999999.99)
  participationFee?: number; // 참가료 (원 단위, 소수점 2자리까지)

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
