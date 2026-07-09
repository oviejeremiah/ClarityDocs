import {
  Injectable,
  Logger,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from './entities/user.entity';
import { ConfigService } from '@nestjs/config';

export interface CreateUserDto {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedAdminUser();
  }

  private async seedAdminUser(): Promise<void> {
    const adminEmail = this.configService.get<string>(
      'ADMIN_EMAIL',
      'admin@claritydocs.com',
    );
    const existing = await this.userRepository.findOne({
      where: { email: adminEmail },
    });
    if (existing) {
      this.logger.log(`Admin user already exists: ${adminEmail}`);
      return;
    }
    const adminPassword = this.configService.get<string>(
      'ADMIN_PASSWORD',
      'ClarityDocs2026!',
    );
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    const admin = this.userRepository.create({
      email: adminEmail,
      passwordHash,
      name: 'Admin',
      role: UserRole.ADMIN,
      isActive: true,
    });
    await this.userRepository.save(admin);
    this.logger.log(`Admin user seeded: ${adminEmail}`);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException(`User with email ${dto.email} already exists`);
    }
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = this.userRepository.create({
      email: dto.email,
      passwordHash,
      name: dto.name,
      role: dto.role ?? UserRole.USER,
      isActive: true,
    });
    const saved = await this.userRepository.save(user);
    this.logger.log(`User created: ${saved.email}`);
    return saved;
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userRepository.update(id, { lastLoginAt: new Date() });
  }

  async deactivate(id: string): Promise<void> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    await this.userRepository.update(id, { isActive: false });
    this.logger.log(`User deactivated: ${user.email}`);
  }
}
