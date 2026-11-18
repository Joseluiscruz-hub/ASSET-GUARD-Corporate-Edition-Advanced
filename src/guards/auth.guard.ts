// =======================================================================================
// auth.guard.ts — AssetGuard Corporate Edition Advanced
// Guard funcional con roles + helpers de vistas para RBAC en el shell.
// =======================================================================================

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs';
import { defaultPathForRole } from './view-permissions';

export { VIEW_PERMISSIONS, canAccessView, getDefaultViewForRole, defaultPathForRole } from './view-permissions';

/**
 * Guard de autenticación. Uso en app.routes.ts:
 *   { path: 'dashboard', loadComponent: ..., canActivate: [authGuard] }
 * Para restringir por rol: canActivate: [roleGuard(['admin'])]
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  return resolveAccess(authService, router);
};

export function roleGuard(allowedRoles: string[]): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    return resolveAccess(authService, router, allowedRoles);
  };
}

function resolveAccess(
  authService: AuthService,
  router: Router,
  allowedRoles?: string[]
) {
  if (!authService.isAuthReady()) {
    return toObservable(authService.isAuthReady).pipe(
      filter(ready => ready === true),
      take(1),
      map(() => evaluateAccess(authService, router, allowedRoles))
    );
  }
  return evaluateAccess(authService, router, allowedRoles);
}

function evaluateAccess(
  authService: AuthService,
  router: Router,
  allowedRoles?: string[]
): boolean {
  const user    = authService.currentUser();
  const profile = authService.userProfile();

  if (!user) {
    router.navigate(['/login']);
    return false;
  }

  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }

  if (profile && allowedRoles.includes(profile.role)) {
    return true;
  }

  router.navigate([defaultPathForRole(profile?.role)]);
  return false;
}
