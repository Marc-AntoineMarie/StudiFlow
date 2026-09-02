import { ParametresService } from './parametres.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ParametresService', () => {
  let prisma: { config: { findUnique: jest.Mock; create: jest.Mock; update: jest.Mock } };
  let service: ParametresService;

  beforeEach(() => {
    prisma = {
      config: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    };
    service = new ParametresService(prisma as unknown as PrismaService);
  });

  it('get : renvoie la config existante', async () => {
    prisma.config.findUnique.mockResolvedValue({ id: 1, seuilHeures: 507 });
    const result = await service.get();
    expect(result.seuilHeures).toBe(507);
    expect(prisma.config.create).not.toHaveBeenCalled();
  });

  it("get : crée la ligne id=1 si absente (filet de sécurité)", async () => {
    prisma.config.findUnique.mockResolvedValue(null);
    prisma.config.create.mockResolvedValue({ id: 1, seuilHeures: 507 });
    await service.get();
    expect(prisma.config.create).toHaveBeenCalledWith({ data: { id: 1 } });
  });

  it('update : transmet uniquement les champs fournis', async () => {
    prisma.config.findUnique.mockResolvedValue({ id: 1 });
    prisma.config.update.mockResolvedValue({ id: 1, seuilHeures: 400 });
    await service.update({ seuilHeures: 400 });
    expect(prisma.config.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { seuilHeures: 400 },
    });
  });
});
