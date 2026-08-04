import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AccessStore } from '../../../core/state/access.store';

/**
 * Prompts for the shared access PIN before Controls / Diagnostics routes load.
 * Usable with a TV remote (focusable fields and buttons, no native prompts).
 */
@Component({
  selector: 'app-pin-unlock-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>Unlock required</h2>
    <mat-dialog-content>
      <p>Enter the access PIN to open Controls or Diagnostics.</p>
      <mat-form-field appearance="outline" class="pin-field">
        <mat-label>Access PIN</mat-label>
        <input
          matInput
          type="password"
          name="pin"
          autocomplete="current-password"
          cdkFocusInitial
          [ngModel]="pin()"
          (ngModelChange)="pin.set($event)"
          (keyup.enter)="submit()"
          [disabled]="submitting()"
        />
      </mat-form-field>
      @if (error()) {
        <p class="pin-error" role="alert">{{ error() }}</p>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" [disabled]="submitting()" (click)="dialogRef.close(false)">
        Cancel
      </button>
      <button
        mat-flat-button
        color="primary"
        type="button"
        [disabled]="submitting() || !pin().trim()"
        (click)="submit()"
      >
        @if (submitting()) {
          <mat-spinner diameter="18" />
        } @else {
          Unlock
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .pin-field {
      width: 100%;
      margin-top: 0.5rem;
    }

    .pin-error {
      color: var(--mat-sys-error, #f2b8b5);
      margin: 0.25rem 0 0;
    }

    mat-spinner {
      display: inline-block;
    }
  `,
})
export class PinUnlockDialog {
  protected readonly dialogRef = inject<MatDialogRef<PinUnlockDialog, boolean>>(MatDialogRef);
  private readonly access = inject(AccessStore);

  protected readonly pin = signal('');
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);

  protected async submit(): Promise<void> {
    const value = this.pin().trim();
    if (!value || this.submitting()) return;

    this.submitting.set(true);
    this.error.set(null);

    try {
      await this.access.unlock(value);
      this.dialogRef.close(true);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Unlock failed');
      this.submitting.set(false);
    }
  }
}
