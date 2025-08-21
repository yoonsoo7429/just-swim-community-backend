import { IsString, IsOptional, IsEnum, IsNumber } from 'class-validator';

export class CreateCommunityPostDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsEnum(['training', 'recruitment', 'general'])
  type?: string;

  @IsOptional()
  @IsNumber()
  trainingProgramId?: number;
}

