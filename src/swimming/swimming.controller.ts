import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { SwimmingService } from './swimming.service';
import { CreateSwimmingDto } from './dto/create-swimming.dto';
import { UpdateSwimmingDto } from './dto/update-swimming.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('swimming')
export class SwimmingController {
  constructor(private readonly swimmingService: SwimmingService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createSwimmingDto: CreateSwimmingDto, @Req() req: any) {
    return this.swimmingService.create({
      ...createSwimmingDto,
      userId: req.user.id,
    });
  }

  @Get()
  findAll() {
    return this.swimmingService.findAll();
  }

  @Get('stats')
  getStats() {
    return this.swimmingService.getStats();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.swimmingService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSwimmingDto: UpdateSwimmingDto,
  ) {
    return this.swimmingService.update(id, updateSwimmingDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.swimmingService.remove(id);
  }
}
