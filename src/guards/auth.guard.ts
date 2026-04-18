// =======================================================================================
// auth.guard.ts — AssetGuard Corporate Edition Advanced
// Guard de rutas con soporte para roles dinámicos (admin, technician, planner, viewer)
// =======================================================================================

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs';

/**
 * Guard para proteger rutas y verificar roles.
 * Uso en app.routes.ts:
 * { path: 'admin', component: AdminComponent, canActivate: [authGuard(['admin'])] }
 */
export const authGuard = (allowedRoles?: string[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Esperar a que la autenticación esté lista
    if (!authService.isAuthReady()) {
      // Si no está lista, redirigir al login o permitir carga si es asíncrono
      // En este caso, el service maneja el estado de carga
    }

    const user = authService.currentUser();
    const profile = authService.userProfile();

    // 1. Verificar si el usuario está autenticado
    if (!user) {
      router.navigate(['/login']);
      return false;
    }

    // 2. Si no se especifican roles, cualquier usuario autenticado puede entrar
    if (!allowedRoles || allowedRoles.length === 0) {
      return true;
    }

    // 3. Verificar si el rol del perfil está dentro de los permitidos
    if (profile && allowedRoles.includes(profile.role)) {
      return true;
    }

    // 4. Redirigir si no tiene permiso (e.g., al dashboard)
    router.navigate(['/dashboard']);
    return false;
  };
};
