import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

export interface UserStats {
  userId: number;
  name: string;
  totalNotes: number;
  pinnedNotes: number;
  totalViews: number;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  findAll() {
    return this.userRepository.find({
      relations: { profile: true },
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: { profile: true, notes: true },
    });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async create(dto: CreateUserDto) {
    await this.ensureEmailFree(dto.email);
    const user = this.userRepository.create(dto); // cascade saves profile
    return this.userRepository.save(user);
  }

  async update(id: number, dto: UpdateUserDto) {
    const user = await this.findOne(id);
    if (dto.email && dto.email !== user.email) {
      await this.ensureEmailFree(dto.email);
    }
    const { profile, ...rest } = dto;
    Object.assign(user, rest);
    if (profile) user.profile = Object.assign(user.profile ?? {}, profile) as any;
    return this.userRepository.save(user);
  }

  async remove(id: number) {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
    return { message: `User ${id} deleted` };
  }

  // Task 5: statistics with the Query Builder
  async getStats(id: number): Promise<UserStats> {
    const raw = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.notes', 'note')
      .select('user.id', 'userId')
      .addSelect('user.name', 'name')
      .addSelect('COUNT(note.id)', 'totalNotes')
      .addSelect(
        'COUNT(note.id) FILTER (WHERE note."isPinned" = true)',
        'pinnedNotes',
      )
      .addSelect('COALESCE(SUM(note.views), 0)', 'totalViews')
      .where('user.id = :id', { id })
      .groupBy('user.id')
      .getRawOne();

    if (!raw) throw new NotFoundException(`User ${id} not found`);

    // PostgreSQL returns COUNT/SUM as strings (bigint) -> convert to numbers
    return {
      userId: Number(raw.userId),
      name: raw.name,
      totalNotes: Number(raw.totalNotes),
      pinnedNotes: Number(raw.pinnedNotes),
      totalViews: Number(raw.totalViews),
    };
  }

  private async ensureEmailFree(email: string) {
    const exists = await this.userRepository.existsBy({ email });
    if (exists) throw new ConflictException(`Email "${email}" is already used`);
  }
}
