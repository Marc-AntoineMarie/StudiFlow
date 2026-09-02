import { Injectable } from '@nestjs/common';
import { Config } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateConfigDto } from './dto/update-config.dto';

@Injectable()
export class ParametresService {
  constructor(private readonly prisma: PrismaService) {}

  /** La ligne id=1 est censée exister (seed) ; filet de sécurité si jamais absente. */
  async get(): Promise<Config> {
    const config = await this.prisma.config.findUnique({ where: { id: 1 } });
    if (config) return config;
    return this.prisma.config.create({ data: { id: 1 } });
  }

  async update(dto: UpdateConfigDto): Promise<Config> {
    await this.get();
    return this.prisma.config.update({ where: { id: 1 }, data: dto });
  }
}
