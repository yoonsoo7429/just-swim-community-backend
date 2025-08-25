import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';

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
  @IsEnum(['private', 'public'])
  visibility?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
