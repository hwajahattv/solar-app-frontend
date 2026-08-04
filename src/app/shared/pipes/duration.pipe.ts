import { Pipe, PipeTransform } from '@angular/core';

const EM_DASH = '—';

/** Renders a millisecond duration as a compact "2d 4h 13m" style string. */
@Pipe({ name: 'duration' })
export class DurationPipe implements PipeTransform {
  transform(milliseconds: number | null | undefined): string {
    if (milliseconds === null || milliseconds === undefined || milliseconds < 0) return EM_DASH;

    const seconds = Math.floor(milliseconds / 1000);
    const parts: string[] = [];

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds / 3600) % 24);
    const minutes = Math.floor((seconds / 60) % 60);
    const remainder = seconds % 60;

    if (days) parts.push(`${days}d`);
    if (hours) parts.push(`${hours}h`);
    if (minutes) parts.push(`${minutes}m`);
    if (remainder || parts.length === 0) parts.push(`${remainder}s`);

    return parts.join(' ');
  }
}
