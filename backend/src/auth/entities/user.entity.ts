import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('users')
@Index(['email'], { unique: true })
export class User {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ example: 'admin@claritydocs.com' })
  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @ApiProperty({ example: 'Admin User' })
  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255 })
  passwordHash!: string;

  @ApiProperty({ enum: ['admin', 'user'], example: 'admin' })
  @Column({ type: 'varchar', length: 50, default: 'user' })
  role!: 'admin' | 'user';

  @ApiProperty({ example: true })
  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @ApiProperty()
  @CreateDateColumn()
  createdAt!: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt!: Date;
}
