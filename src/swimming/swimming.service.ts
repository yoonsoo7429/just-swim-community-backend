import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SwimmingRecord } from './entities/swimming.entity';
import { CreateSwimmingDto } from './dto/create-swimming.dto';
import { UpdateSwimmingDto } from './dto/update-swimming.dto';

@Injectable()
export class SwimmingService {
  constructor(
    @InjectRepository(SwimmingRecord)
    private swimmingRepository: Repository<SwimmingRecord>,
  ) {}

  async create(createSwimmingDto: CreateSwimmingDto): Promise<SwimmingRecord> {
    const swimming = this.swimmingRepository.create(createSwimmingDto);
    return await this.swimmingRepository.save(swimming);
  }

  async findAll(): Promise<SwimmingRecord[]> {
    return await this.swimmingRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<SwimmingRecord> {
    const swimming = await this.swimmingRepository.findOne({ 
      where: { id },
      relations: ['user'],
    });
    if (!swimming) {
      throw new NotFoundException(`Swimming record with ID ${id} not found`);
    }
    return swimming;
  }

  async update(
    id: number,
    updateSwimmingDto: UpdateSwimmingDto,
  ): Promise<SwimmingRecord> {
    const swimming = await this.findOne(id);
    Object.assign(swimming, updateSwimmingDto);
    return await this.swimmingRepository.save(swimming);
  }

  async remove(id: number): Promise<void> {
    const swimming = await this.findOne(id);
    await this.swimmingRepository.remove(swimming);
  }

  async getStats() {
    const totalSessions = await this.swimmingRepository.count();
    const totalDistance = await this.swimmingRepository
      .createQueryBuilder('swimming')
      .select('SUM(swimming.distance)', 'totalDistance')
      .getRawOne();

    const totalDuration = await this.swimmingRepository
      .createQueryBuilder('swimming')
      .select('SUM(swimming.duration)', 'totalDuration')
      .getRawOne();

    const totalCalories = await this.swimmingRepository
      .createQueryBuilder('swimming')
      .select('SUM(swimming.calories)', 'totalCalories')
      .getRawOne();

    return {
      totalSessions,
      totalDistance: parseInt(totalDistance.totalDistance) || 0,
      totalDuration: parseInt(totalDuration.totalDuration) || 0,
      totalCalories: parseInt(totalCalories.totalCalories) || 0,
    };
  }
}
