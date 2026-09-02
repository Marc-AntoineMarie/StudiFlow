import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

function fichier(overrides: Partial<Express.Multer.File> = {}): Express.Multer.File {
  return {
    fieldname: 'file',
    originalname: 'contrat.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    buffer: Buffer.from('contenu'),
    size: 7,
    ...overrides,
  } as Express.Multer.File;
}

describe('DocumentsService', () => {
  let prisma: {
    mission: { findUnique: jest.Mock };
    document: {
      create: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };
  let storage: {
    enregistrer: jest.Mock;
    supprimer: jest.Mock;
    cheminComplet: jest.Mock;
    genererMiniaturePdf: jest.Mock;
    cheminMiniature: jest.Mock;
    miniatureExiste: jest.Mock;
  };
  let service: DocumentsService;

  beforeEach(() => {
    prisma = {
      mission: { findUnique: jest.fn() },
      document: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    storage = {
      enregistrer: jest.fn().mockResolvedValue({ stockageNom: 'uuid.pdf', tailleOctets: 7 }),
      supprimer: jest.fn().mockResolvedValue(undefined),
      cheminComplet: jest.fn().mockReturnValue('/app/uploads/uuid.pdf'),
      genererMiniaturePdf: jest.fn().mockResolvedValue(undefined),
      cheminMiniature: jest.fn().mockReturnValue('/app/uploads/uuid.pdf.png'),
      miniatureExiste: jest.fn().mockResolvedValue(false),
    };
    service = new DocumentsService(
      prisma as unknown as PrismaService,
      storage as unknown as StorageService,
    );
  });

  it('rejette un upload sans fichier', async () => {
    await expect(service.create(undefined, { categorie: 'CONTRAT' } as never)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejette un type MIME non autorisé', async () => {
    await expect(
      service.create(fichier({ mimetype: 'application/zip' }), { categorie: 'CONTRAT' } as never),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejette un document rattaché à une mission inexistante', async () => {
    prisma.mission.findUnique.mockResolvedValue(null);
    await expect(
      service.create(fichier(), { categorie: 'CONTRAT', missionId: 99 } as never),
    ).rejects.toThrow(NotFoundException);
  });

  it('enregistre le fichier et crée le document en base', async () => {
    prisma.mission.findUnique.mockResolvedValue({ id: 1 });
    prisma.document.create.mockResolvedValue({ id: 1 });

    await service.create(fichier(), { categorie: 'CONTRAT', missionId: 1 } as never);

    expect(storage.enregistrer).toHaveBeenCalledWith(expect.any(Buffer), 'contrat.pdf');
    expect(prisma.document.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        nomFichier: 'contrat.pdf',
        stockageNom: 'uuid.pdf',
        tailleOctets: 7,
        categorie: 'CONTRAT',
        missionId: 1,
      }),
    });
  });

  it('génère une miniature pour un PDF uploadé', async () => {
    prisma.document.create.mockResolvedValue({ id: 1 });
    await service.create(fichier({ mimetype: 'application/pdf' }), { categorie: 'AUTRE' } as never);
    expect(storage.genererMiniaturePdf).toHaveBeenCalledWith('uuid.pdf');
  });

  it('ne tente pas de miniature pour une image', async () => {
    prisma.document.create.mockResolvedValue({ id: 1 });
    await service.create(fichier({ mimetype: 'image/png' }), { categorie: 'AUTRE' } as never);
    expect(storage.genererMiniaturePdf).not.toHaveBeenCalled();
  });

  it('getMiniature : renvoie le fichier original pour une image', async () => {
    prisma.document.findUnique.mockResolvedValue({ id: 1, mimeType: 'image/jpeg', stockageNom: 'x.jpg' });
    const m = await service.getMiniature(1);
    expect(m).toEqual({ chemin: '/app/uploads/uuid.pdf', mimeType: 'image/jpeg' });
  });

  it('getMiniature : renvoie la miniature PNG si un PDF en a une', async () => {
    prisma.document.findUnique.mockResolvedValue({ id: 1, mimeType: 'application/pdf', stockageNom: 'x.pdf' });
    storage.miniatureExiste.mockResolvedValue(true);
    const m = await service.getMiniature(1);
    expect(m).toEqual({ chemin: '/app/uploads/uuid.pdf.png', mimeType: 'image/png' });
  });

  it("getMiniature : null si le PDF n'a pas de miniature générée", async () => {
    prisma.document.findUnique.mockResolvedValue({ id: 1, mimeType: 'application/pdf', stockageNom: 'x.pdf' });
    storage.miniatureExiste.mockResolvedValue(false);
    const m = await service.getMiniature(1);
    expect(m).toBeNull();
  });

  it('getMiniature : null pour une catégorie de fichier sans aperçu possible', async () => {
    prisma.document.findUnique.mockResolvedValue({ id: 1, mimeType: 'application/zip', stockageNom: 'x.zip' });
    const m = await service.getMiniature(1);
    expect(m).toBeNull();
  });

  it('findAll : missionId="none" filtre sur les documents globaux', async () => {
    prisma.document.findMany.mockResolvedValue([]);
    await service.findAll({ missionId: 'none' });
    expect(prisma.document.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { missionId: null } }),
    );
  });

  it('findAll : missionId numérique filtre sur cette mission', async () => {
    prisma.document.findMany.mockResolvedValue([]);
    await service.findAll({ missionId: '5' });
    expect(prisma.document.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { missionId: 5 } }),
    );
  });

  it('update : rattache un document existant à une mission', async () => {
    prisma.document.findUnique.mockResolvedValue({ id: 1, stockageNom: 'uuid.pdf' });
    prisma.mission.findUnique.mockResolvedValue({ id: 3 });
    prisma.document.update.mockResolvedValue({ id: 1, missionId: 3 });

    await service.update(1, { missionId: 3 });

    expect(prisma.document.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { missionId: 3 },
      include: { mission: { select: { id: true, titre: true } } },
    });
  });

  it('update : détache un document (missionId: null) sans vérifier de mission', async () => {
    prisma.document.findUnique.mockResolvedValue({ id: 1, stockageNom: 'uuid.pdf' });
    prisma.document.update.mockResolvedValue({ id: 1, missionId: null });

    await service.update(1, { missionId: null });

    expect(prisma.mission.findUnique).not.toHaveBeenCalled();
    expect(prisma.document.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { missionId: null },
      include: { mission: { select: { id: true, titre: true } } },
    });
  });

  it('update : rejette si la mission ciblée n’existe pas', async () => {
    prisma.document.findUnique.mockResolvedValue({ id: 1, stockageNom: 'uuid.pdf' });
    prisma.mission.findUnique.mockResolvedValue(null);
    await expect(service.update(1, { missionId: 99 })).rejects.toThrow(NotFoundException);
  });

  it('update : id de document inexistant → 404', async () => {
    prisma.document.findUnique.mockResolvedValue(null);
    await expect(service.update(1, { missionId: 3 })).rejects.toThrow(NotFoundException);
  });

  it('remove : supprime le fichier puis la ligne en base', async () => {
    prisma.document.findUnique.mockResolvedValue({ id: 1, stockageNom: 'uuid.pdf' });
    await service.remove(1);
    expect(storage.supprimer).toHaveBeenCalledWith('uuid.pdf');
    expect(prisma.document.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it('remove : 404 si le document est déjà absent', async () => {
    prisma.document.findUnique.mockResolvedValue(null);
    await expect(service.remove(404)).rejects.toThrow(NotFoundException);
  });
});
