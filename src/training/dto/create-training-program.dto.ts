import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean, Min, Max } from 'class-validator';

export class CreateTrainingProgramDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['beginner', 'intermediate', 'advanced'])
  difficulty?: string;

  @IsOptional()
  @IsEnum(['regular', 'short-term'])
  type?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(52)
  totalWeeks?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(7)
  sessionsPerWeek?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  totalSessions?: number;

  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(480)
  estimatedDuration?: number;

  @IsOptional()
  @IsEnum(['private', 'public'])
  visibility?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  maxParticipants?: number;
}

