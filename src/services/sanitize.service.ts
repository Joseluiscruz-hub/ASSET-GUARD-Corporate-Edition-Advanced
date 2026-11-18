import { Injectable, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { sanitizeRawHtml } from '../utils/html-sanitize';

export { sanitizeRawHtml };

@Injectable({
  providedIn: 'root',
})
export class SanitizeService {
  private sanitizer = inject(DomSanitizer);

  sanitizeHtml(dirtyHtml: string | null | undefined): SafeHtml {
    const clean = sanitizeRawHtml(dirtyHtml);
    return this.sanitizer.bypassSecurityTrustHtml(clean);
  }

  sanitizeRaw(dirtyHtml: string | null | undefined): string {
    return sanitizeRawHtml(dirtyHtml);
  }
}
