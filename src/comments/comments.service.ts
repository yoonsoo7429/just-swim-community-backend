import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
  ) {}

  async create(commentData: Partial<Comment>): Promise<Comment> {
    const comment = this.commentRepository.create(commentData);
    return await this.commentRepository.save(comment);
  }

  async findBySwimmingRecord(swimmingRecordId: number): Promise<Comment[]> {
    return await this.commentRepository.find({
      where: { swimmingRecordId },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  }

  async remove(id: number): Promise<void> {
    const comment = await this.commentRepository.findOne({ where: { id } });
    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }
    await this.commentRepository.remove(comment);
  }
}
