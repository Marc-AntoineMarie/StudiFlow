import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
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
   * Mono-utilisateur : pas d'inscription publique ouverte, mais un client qui
   * reprend le projet sur son propre serveur (base vide, pas de seed avec des
   * identifiants par défaut) doit pouvoir créer SON unique compte lui-même,
   * sans toucher à Docker ou à la ligne de commande.
   */
  async compteExiste(): Promise<boolean> {
    const total = await this.prisma.user.count();
    return total > 0;
  }

  /**
   * Crée l'unique compte, une seule fois. Se ferme dès qu'un compte existe —
   * ni un flux d'inscription réutilisable, ni une porte dérobée permanente.
   */
  async creerCompteInitial(
    email: string,
    password: string,
  ): Promise<{ token: string; expiresIn: string }> {
    const total = await this.prisma.user.count();
    if (total > 0) {
      throw new ConflictException(
        'Un compte existe déjà. La création de compte est à usage unique.',
      );
    }

    const passwordHash = await argon2.hash(password);
    const user = await this.prisma.user.create({ data: { email, passwordHash } });

    const token = await this.jwtService.signAsync({ sub: user.id, email: user.email });
    return { token, expiresIn: '12h' };
  }

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
