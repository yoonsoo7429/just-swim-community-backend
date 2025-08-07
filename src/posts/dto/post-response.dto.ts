import { User } from '../../users/entities/user.entity';

export class PostResponseDto {
  id: number;
  title: string;
  content: string;
  category: string;
  author: User;
  likes: number;
  comments: number;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  isLiked?: boolean;
}
