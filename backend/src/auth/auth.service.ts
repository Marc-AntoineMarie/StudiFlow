import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Vérifie les identifiants et renvoie un JWT.
   * Message d'erreur volontairement générique : on ne distingue jamais
   * « email inconnu » de « mot de passe incorrect ».
   */
  async login(email: string, password: string): Promise<{ token: string; expiresIn: string }> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const motDePasseValide = await argon2.verify(user.passwordHash, password);
    if (!motDePasseValide) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const token = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
    });

    return { token, expiresIn: '12h' };
  }

  async me(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, createdAt: true },
    });
    if (!user) throw new UnauthorizedException('Utilisateur introuvable');
    return user;
  }
}
