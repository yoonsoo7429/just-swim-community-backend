import {
  IsEnum,
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { GoalType, GoalDifficulty } from '../entities/goal.entity';

export class CreateGoalDto {
  @IsEnum(GoalType)
  type: GoalType;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  targetValue: number;

  @IsString()
  unit: string;

  @IsOptional()
  @IsEnum(GoalDifficulty)
  difficulty?: GoalDifficulty;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  metadata?: any;
}
