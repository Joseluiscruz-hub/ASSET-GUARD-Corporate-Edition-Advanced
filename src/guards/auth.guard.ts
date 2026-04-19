// =======================================================================================
// auth.guard.ts — AssetGuard Corporate Edition Advanced
// Guard funcional con roles. La app es SPA (sin Angular Router activo),
// por lo que este guard está listo para cuando se active el Router.
// =======================================================================================

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs';

/**
 * Guard para proteger rutas y verificar roles.
 * Uso en app.routes.ts:
 *   { path: 'admin', component: AdminComponent, canActivate: [authGuard(['admin'])] }
 */
export const authGuard = (allowedRoles?: string[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router      = inject(Router);

    // Si la auth aún no está lista, esperamos a que lo esté (Observable)
    if (!authService.isAuthReady()) {
      return toObservable(authService.isAuthReady).pipe(
        filter(ready => ready === true),
        take(1),
        map(() => evaluateAccess(authService, router, allowedRoles))
      );
    }

    return evaluateAccess(authService, router, allowedRoles);
  };
};

function evaluateAccess(
  authService: AuthService,
  router: Router,
  allowedRoles?: string[]
): boolean {
  const user    = authService.currentUser();
  const profile = authService.userProfile();

  // 1. Sin sesión → redirigir a login
  if (!user) {
    router.navigate(['/login']);
    return false;
  }

  // 2. Sin restricción de rol → cualquier usuario autenticado puede entrar
  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }

  // 3. Verificar rol
  if (profile && allowedRoles.includes(profile.role)) {
    return true;
  }

  // 4. Sin permiso → redirigir al dashboard
  router.navigate(['/dashboard']);
  return false;
}
