import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string): void {
    this.open(message, 'notification-success', 4000);
  }

  error(message: string): void {
    // Errors stay longer because they usually require the user to act.
    this.open(message, 'notification-error', 8000);
  }

  info(message: string): void {
    this.open(message, 'notification-info', 4000);
  }

  private open(message: string, panelClass: string, duration: number): void {
    this.snackBar.open(message, 'Dismiss', {
      duration,
      panelClass,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }
}
