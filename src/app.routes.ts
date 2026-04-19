import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'assets',
    loadComponent: () => import('./components/admin/asset-list.component').then(m => m.AssetListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'asset/:id',
    loadComponent: () => import('./components/asset-detail/asset-detail.component').then(m => m.AssetDetailComponent),
    canActivate: [authGuard]
  },
  {
    path: 'service',
    loadComponent: () => import('./components/service-panel.component').then(m => m.ServicePanelComponent),
    canActivate: [authGuard]
  },
  {
    path: 'report',
    loadComponent: () => import('./components/solicitor-panel/solicitor-panel.component').then(m => m.SolicitorPanelComponent),
    canActivate: [authGuard]
  },
  {
    path: 'compliance',
    loadComponent: () => import('./components/maintenance-compliance/maintenance-compliance.component').then(m => m.MaintenanceComplianceComponent),
    canActivate: [authGuard]
  },
  {
    path: 'inventory',
    loadComponent: () => import('./components/inventory/inventory.component').then(m => m.InventoryComponent),
    canActivate: [authGuard]
  },
  {
    path: 'work-orders',
    loadComponent: () => import('./components/work-orders/work-orders.component').then(m => m.WorkOrdersComponent),
    canActivate: [authGuard]
  },
  {
    path: 'admin',
    loadComponent: () => import('./components/admin/admin.component').then(m => m.AdminComponent),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
