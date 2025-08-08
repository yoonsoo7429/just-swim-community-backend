import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
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
  create(@Body() createSwimmingDto: CreateSwimmingDto, @Request() req) {
    createSwimmingDto.userId = req.user.id;
    return this.swimmingService.create(createSwimmingDto);
  }

  @Get()
  findAll() {
    return this.swimmingService.findAll();
  }

  @Get('my-records')
  @UseGuards(JwtAuthGuard)
  findMyRecords(@Request() req) {
    return this.swimmingService.findByUser(req.user.id);
  }

  @Get('recent')
  getRecentRecords(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit) : 10;
    return this.swimmingService.getRecentRecords(limitNum);
  }

  @Get('style/:style')
  getRecordsByStyle(@Param('style') style: string) {
    return this.swimmingService.getRecordsByStyle(style);
  }

  @Get('stats')
  getStats() {
    return this.swimmingService.getStats();
  }

  @Get('my-stats')
  @UseGuards(JwtAuthGuard)
  getMyStats(@Request() req) {
    return this.swimmingService.getUserStats(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.swimmingService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateSwimmingDto: UpdateSwimmingDto,
  ) {
    return this.swimmingService.update(+id, updateSwimmingDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.swimmingService.remove(+id);
  }
}
