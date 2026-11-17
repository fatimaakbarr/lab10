import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Note } from './note.entity';
import { User } from '../users/user.entity';
import { Tag } from '../tags/tag.entity';
import { Category } from '../categories/category.entity';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';

@Module({
  imports: [TypeOrmModule.forFeature([Note, User, Tag, Category])],
  controllers: [NotesController],
  providers: [NotesService],
})
export class NotesModule {}
