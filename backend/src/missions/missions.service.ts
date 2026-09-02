import { Injectable, NotFoundException } from '@nestjs/common';
import { Mission } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMissionDto } from './dto/create-mission.dto';
import { UpdateMissionDto } from './dto/update-mission.dto';
import { QueryMissionsDto } from './dto/query-missions.dto';
import { validerEtNormaliserMission } from './mission-validation';

@Injectable()
export class MissionsService {
  constructor(private readonly prisma: PrismaService) {}

  private async heuresParCachet(): Promise<number> {
    const config = await this.prisma.config.findUnique({ where: { id: 1 } });
    return config?.heuresParCachet ?? 8;
  }

  async create(dto: CreateMissionDto): Promise<Mission> {
    const heuresParCachet = await this.heuresParCachet();

    const normalise = validerEtNormaliserMission(
      {
        type: dto.type,
        statut: dto.statut ?? 'PROPOSEE',
        dateDebut: new Date(dto.dateDebut),
        dateFin: new Date(dto.dateFin),
        heures: dto.heures ?? null,
        nbCachets: dto.nbCachets ?? null,
        montantHT: dto.montantHT ?? null,
        nbJours: dto.nbJours ?? null,
      },
      heuresParCachet,
    );

    return this.prisma.mission.create({
      data: {
        titre: dto.titre,
        clientOuProduction: dto.clientOuProduction,
        type: dto.type,
        statut: dto.statut ?? 'PROPOSEE',
        dateDebut: normalise.dateDebut,
        dateFin: normalise.dateFin,
        note: dto.note,
        heures: normalise.heures,
        nbCachets: normalise.nbCachets,
        montantHT: normalise.montantHT,
        nbJours: normalise.nbJours,
      },
    });
  }

  findAll(query: QueryMissionsDto): Promise<Mission[]> {
    return this.prisma.mission.findMany({
      where: {
        type: query.type,
        statut: query.statut,
      },
      orderBy: { dateDebut: 'desc' },
    });
  }

  async findOne(id: number) {
    const mission = await this.prisma.mission.findUnique({
      where: { id },
      include: { documents: true },
    });
    if (!mission) throw new NotFoundException(`Mission ${id} introuvable`);
    return mission;
  }

  async update(id: number, dto: UpdateMissionDto): Promise<Mission> {
    const existante = await this.findOne(id);
    const heuresParCachet = await this.heuresParCachet();

    const normalise = validerEtNormaliserMission(
      {
        type: dto.type ?? existante.type,
        statut: dto.statut ?? existante.statut,
        dateDebut: dto.dateDebut ? new Date(dto.dateDebut) : existante.dateDebut,
        dateFin: dto.dateFin ? new Date(dto.dateFin) : existante.dateFin,
        heures: dto.heures !== undefined ? dto.heures : existante.heures,
        nbCachets: dto.nbCachets !== undefined ? dto.nbCachets : existante.nbCachets,
        montantHT: dto.montantHT !== undefined ? dto.montantHT : existante.montantHT,
        nbJours: dto.nbJours !== undefined ? dto.nbJours : existante.nbJours,
      },
      heuresParCachet,
    );

    return this.prisma.mission.update({
      where: { id },
      data: {
        titre: dto.titre ?? existante.titre,
        clientOuProduction: dto.clientOuProduction ?? existante.clientOuProduction,
        type: normalise.type,
        statut: dto.statut ?? existante.statut,
        dateDebut: normalise.dateDebut,
        dateFin: normalise.dateFin,
        note: dto.note !== undefined ? dto.note : existante.note,
        heures: normalise.heures,
        nbCachets: normalise.nbCachets,
        montantHT: normalise.montantHT,
        nbJours: normalise.nbJours,
      },
    });
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id); // 404 propre si absente
    await this.prisma.mission.delete({ where: { id } });
    // Les documents rattachés passent missionId=null en base (onDelete: SetNull),
    // ils ne sont jamais supprimés avec la mission.
  }
}
