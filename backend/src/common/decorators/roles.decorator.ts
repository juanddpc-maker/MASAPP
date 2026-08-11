import { SetMetadata } from '@nestjs/common';

// Uso: @Roles('ADMINISTRADOR', 'INSTRUCTOR') encima de cualquier endpoint
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
