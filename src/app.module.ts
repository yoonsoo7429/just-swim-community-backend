import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TrainingModule } from './training/training.module';
import { TrainingProgressModule } from './training-progress/training-progress.module';
import { TrainingReviewModule } from './training-review/training-review.module';

import { SwimmingModule } from './swimming/swimming.module';
import { PostsModule } from './posts/posts.module';
import { CommentsModule } from './comments/comments.module';
import { BadgesModule } from './badges/badges.module';
import { LevelsModule } from './levels/levels.module';
import { LeaderboardsModule } from './leaderboards/leaderboards.module';
import { GoalsModule } from './goals/goals.module';
import { SocialModule } from './social/social.module';
import { MessagesModule } from './messages/messages.module';
import { envValidationSchema } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    TrainingModule,
    TrainingProgressModule,
    TrainingReviewModule,

    SwimmingModule,
    PostsModule,
    CommentsModule,
    BadgesModule,
    LevelsModule,
    LeaderboardsModule,
    GoalsModule,
    SocialModule,
    MessagesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
