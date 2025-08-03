import { PartialType } from '@nestjs/mapped-types';
import { CreateSwimmingDto } from './create-swimming.dto';

export class UpdateSwimmingDto extends PartialType(CreateSwimmingDto) {}
