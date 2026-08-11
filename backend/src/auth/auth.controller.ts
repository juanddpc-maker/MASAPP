import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  login(@Body() body: { correo: string; password: string }) {
    return this.authService.login(body.correo, body.password);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  changePassword(@Body() body: { passwordActual: string; passwordNueva: string }, @Req() req: any) {
    return this.authService.changePassword(req.user.userId, body.passwordActual, body.passwordNueva);
  }
}
