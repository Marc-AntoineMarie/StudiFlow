import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SetupDto } from './dto/setup.dto';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** Le frontend l'appelle avant d'afficher connexion vs création de compte. */
  @Public()
  @Get('setup-requise')
  async setupRequise() {
    const existe = await this.authService.compteExiste();
    return { requise: !existe };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('setup')
  setup(@Body() dto: SetupDto) {
    return this.authService.creerCompteInitial(dto.email, dto.password);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } }) // 5 essais / minute / IP
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Get('me')
  me(@Req() req: Request) {
    return this.authService.me(req.user!.sub);
  }
}
