import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateGoalDto } from './create-goal.dto';
import { GoalStatus } from '../entities/goal.entity';

export class UpdateGoalDto extends PartialType(CreateGoalDto) {
  @IsOptional()
  @IsEnum(GoalStatus)
  status?: GoalStatus;
}
