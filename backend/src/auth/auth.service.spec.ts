import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: { user: { findUnique: jest.Mock } };
  let jwt: { signAsync: jest.Mock };

  const EMAIL = 'demo@cadre.local';
  const MOT_DE_PASSE = 'un-mot-de-passe-solide';

  beforeEach(async () => {
    const passwordHash = await argon2.hash(MOT_DE_PASSE);

    prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 1,
          email: EMAIL,
          passwordHash,
          createdAt: new Date(),
        }),
      },
    };
    jwt = { signAsync: jest.fn().mockResolvedValue('un-faux-jwt') };

    service = new AuthService(
      prisma as unknown as PrismaService,
      jwt as unknown as JwtService,
    );
  });

  it('renvoie un token pour des identifiants valides', async () => {
    const result = await service.login(EMAIL, MOT_DE_PASSE);
    expect(result.token).toBe('un-faux-jwt');
    expect(result.expiresIn).toBe('12h');
    expect(jwt.signAsync).toHaveBeenCalledWith({ sub: 1, email: EMAIL });
  });

  it('rejette un mauvais mot de passe', async () => {
    await expect(service.login(EMAIL, 'mauvais-mot-de-passe')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejette un email inconnu avec le même message que le mauvais mot de passe', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(null);
    await expect(service.login('inconnu@cadre.local', MOT_DE_PASSE)).rejects.toThrow(
      'Identifiants invalides',
    );
  });
});
