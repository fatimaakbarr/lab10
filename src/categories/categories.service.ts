import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Category } from './category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

const UNIQUE_VIOLATION = '23505';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(dto: CreateCategoryDto) {
    await this.ensureNameFree(dto.name);
    const category = this.categoryRepository.create(dto);
    return this.saveOrConflict(category);
  }

  findAll() {
    return this.categoryRepository.find({ order: { name: 'ASC' } });
  }

  async findOne(id: number) {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: { notes: true },
      order: { notes: { id: 'ASC' } },
    });
    if (!category) throw new NotFoundException(`Category ${id} not found`);
    return category;
  }

  async update(id: number, dto: UpdateCategoryDto) {
    const category = await this.categoryRepository.findOneBy({ id });
    if (!category) throw new NotFoundException(`Category ${id} not found`);

    if (dto.name && dto.name !== category.name) {
      await this.ensureNameFree(dto.name);
      category.name = dto.name;
    }
    return this.saveOrConflict(category);
  }

  async remove(id: number) {
    const category = await this.categoryRepository.findOneBy({ id });
    if (!category) throw new NotFoundException(`Category ${id} not found`);
    // FK has ON DELETE SET NULL, so notes stay with categoryId = NULL
    await this.categoryRepository.delete(id);
    return { message: `Category ${id} deleted` };
  }

  private async ensureNameFree(name: string) {
    if (await this.categoryRepository.existsBy({ name })) {
      throw new ConflictException(`Category "${name}" already exists`);
    }
  }

  // Safety net for race conditions: map DB unique violation to 409
  private async saveOrConflict(category: Category) {
    try {
      return await this.categoryRepository.save(category);
    } catch (err) {
      if (
        err instanceof QueryFailedError &&
        (err as any).driverError?.code === UNIQUE_VIOLATION
      ) {
        throw new ConflictException(
          `Category "${category.name}" already exists`,
        );
      }
      throw err;
    }
  }
}
