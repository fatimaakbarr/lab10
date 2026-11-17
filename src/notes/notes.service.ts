import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Note } from './note.entity';
import { User } from '../users/user.entity';
import { Tag } from '../tags/tag.entity';
import { Category } from '../categories/category.entity';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { QueryNotesDto } from './dto/query-notes.dto';

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(Note)
    private readonly noteRepository: Repository<Note>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  // Task 6: pagination + search + tag/category filters
  async findAll(query: QueryNotesDto) {
    const { page, limit, search, tag, categoryId } = query;

    const qb = this.noteRepository
      .createQueryBuilder('note')
      .leftJoinAndSelect('note.category', 'category')
      .leftJoinAndSelect('note.tags', 'tags')
      .leftJoin('note.user', 'user')
      .addSelect(['user.id', 'user.name']);

    if (search) {
      qb.andWhere('note.title ILIKE :search', {
        search: `%${this.escapeLike(search)}%`,
      });
    }

    if (tag) {
      // EXISTS keeps ALL tags of a matching note in the response
      qb.andWhere(
        `EXISTS (
          SELECT 1 FROM note_tags nt
          INNER JOIN tags t ON t.id = nt."tagId"
          WHERE nt."noteId" = note.id AND LOWER(t.name) = LOWER(:tag)
        )`,
        { tag },
      );
    }

    if (categoryId) {
      qb.andWhere('category.id = :categoryId', { categoryId });
    }

    // Task 4: pinned first, then newest first
    qb.orderBy('note.isPinned', 'DESC')
      .addOrderBy('note.createdAt', 'DESC')
      .addOrderBy('note.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  // Task 4: every fetch increases views by 1
  async findOne(id: number) {
    const result = await this.noteRepository.increment({ id }, 'views', 1);
    if (!result.affected) throw new NotFoundException(`Note ${id} not found`);
    return this.loadNote(id);
  }

  async create(dto: CreateNoteDto) {
    const user = await this.userRepository.findOneBy({ id: dto.userId });
    if (!user) throw new NotFoundException(`User ${dto.userId} not found`);

    const category = dto.categoryId
      ? await this.getCategory(dto.categoryId)
      : null;

    const note = this.noteRepository.create({
      title: dto.title,
      content: dto.content,
      user,
      category,
      tags: await this.resolveTags(dto.tags ?? []),
    });
    const saved = await this.noteRepository.save(note);
    return this.loadNote(saved.id);
  }

  async update(id: number, dto: UpdateNoteDto) {
    const note = await this.noteRepository.findOne({
      where: { id },
      relations: { tags: true, category: true },
    });
    if (!note) throw new NotFoundException(`Note ${id} not found`);

    if (dto.title !== undefined) note.title = dto.title;
    if (dto.content !== undefined) note.content = dto.content;
    if (dto.isPinned !== undefined) note.isPinned = dto.isPinned;
    if (dto.tags !== undefined) note.tags = await this.resolveTags(dto.tags);

    if (dto.categoryId === null) {
      note.category = null;
    } else if (dto.categoryId !== undefined) {
      note.category = await this.getCategory(dto.categoryId);
    }

    await this.noteRepository.save(note);
    return this.loadNote(id);
  }

  async remove(id: number) {
    const result = await this.noteRepository.delete(id);
    if (!result.affected) throw new NotFoundException(`Note ${id} not found`);
    return { message: `Note ${id} deleted` };
  }

  // ---------- helpers ----------

  private async loadNote(id: number) {
    const note = await this.noteRepository
      .createQueryBuilder('note')
      .leftJoinAndSelect('note.category', 'category')
      .leftJoinAndSelect('note.tags', 'tags')
      .leftJoin('note.user', 'user')
      .addSelect(['user.id', 'user.name'])
      .where('note.id = :id', { id })
      .getOne();
    if (!note) throw new NotFoundException(`Note ${id} not found`);
    return note;
  }

  private async getCategory(id: number) {
    const category = await this.categoryRepository.findOneBy({ id });
    if (!category) throw new NotFoundException(`Category ${id} not found`);
    return category;
  }

  private async resolveTags(names: string[]): Promise<Tag[]> {
    const clean = [...new Set(names.map((n) => n.trim().toLowerCase()))].filter(
      Boolean,
    );
    if (!clean.length) return [];

    const existing = await this.tagRepository.findBy({ name: In(clean) });
    const missing = clean.filter((n) => !existing.some((t) => t.name === n));
    const created = missing.length
      ? await this.tagRepository.save(
          missing.map((name) => this.tagRepository.create({ name })),
        )
      : [];
    return [...existing, ...created];
  }

  private escapeLike(value: string) {
    return value.replace(/[\\%_]/g, (c) => `\\${c}`);
  }
}
