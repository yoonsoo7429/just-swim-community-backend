import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Get(':id/profile')
  @UseGuards(JwtAuthGuard)
  async getUserProfile(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.usersService.getUserProfile(id, req.user.id);
  }
}
