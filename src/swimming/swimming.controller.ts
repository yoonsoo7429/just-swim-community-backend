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
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.swimmingService.findAll();
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  getStats() {
    return this.swimmingService.getStats();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.swimmingService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSwimmingDto: UpdateSwimmingDto,
  ) {
    return this.swimmingService.update(id, updateSwimmingDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.swimmingService.remove(id);
  }
}
