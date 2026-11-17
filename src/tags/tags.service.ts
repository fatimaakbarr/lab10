import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from './tag.entity';
import { CreateTagDto } from './dto/create-tag.dto';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
  ) {}

  findAll() {
    return this.tagRepository.find({ order: { name: 'ASC' } });
  }

  async findOne(id: number) {
    const tag = await this.tagRepository.findOne({
      where: { id },
      relations: { notes: true },
    });
    if (!tag) throw new NotFoundException(`Tag ${id} not found`);
    return tag;
  }

  async create(dto: CreateTagDto) {
    const name = dto.name.trim().toLowerCase();
    if (await this.tagRepository.existsBy({ name })) {
      throw new ConflictException(`Tag "${name}" already exists`);
    }
    return this.tagRepository.save(this.tagRepository.create({ name }));
  }

  async remove(id: number) {
    const tag = await this.findOne(id);
    await this.tagRepository.remove(tag);
    return { message: `Tag ${id} deleted` };
  }
}
