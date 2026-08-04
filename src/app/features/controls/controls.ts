import { ChangeDetectionStrategy, Component, effect, inject, OnInit, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { firstValueFrom } from 'rxjs';

import { ControlsApiService } from '../../core/api/controls-api.service';
import { ControlField, ProfileResult, ProfileStep } from '../../core/models/control.model';
import { DeviceRef } from '../../core/models/device.model';
import { NotificationService } from '../../core/notifications/notification.service';
import { ControlsAccessService } from '../../core/state/controls-access.service';
import { DeviceStore } from '../../core/state/device.store';
import { ConfirmDialog, ConfirmDialogData } from '../../shared/ui/confirm-dialog/confirm-dialog';
import { StatusBanner } from '../../shared/ui/status-banner/status-banner';

@Component({
  selector: 'app-controls',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatSelectModule,
    StatusBanner,
  ],
  templateUrl: './controls.html',
  styleUrl: './controls.scss',
})
export class Controls implements OnInit {
  private readonly api = inject(ControlsApiService);
  private readonly devices = inject(DeviceStore);
  private readonly dialog = inject(MatDialog);
  private readonly notifications = inject(NotificationService);
  protected readonly access = inject(ControlsAccessService);

  protected readonly passwordDraft = signal('');

  protected readonly fields = signal<ControlField[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  /** User-edited or device-read value per field. Empty until Read current or manual selection. */
  protected readonly draft = signal<Record<string, string>>({});
  /** Fields whose draft was populated from the inverter via Read current. */
  protected readonly loadedFromDevice = signal<Record<string, boolean>>({});
  protected readonly busyFieldId = signal<string | null>(null);

  protected readonly profileSteps = signal<ProfileStep[]>([]);
  protected readonly profileResult = signal<ProfileResult | null>(null);
  protected readonly applyingProfile = signal(false);

  constructor() {
    effect(() => {
      const device = this.devices.selectedRef();
      const unlocked = this.access.unlocked();
      if (!device || !unlocked) return;
      untracked(() => this.loadFields(device));
    });

    effect(() => {
      if (!this.access.unlocked()) return;
      untracked(() => {
        this.api.preferredProfile().subscribe({
          next: (profile) => this.profileSteps.set(profile.steps),
          error: () => this.profileSteps.set([]),
        });
      });
    });
  }

  ngOnInit(): void {
    void this.access.refresh();
  }

  protected async submitUnlock(): Promise<void> {
    const ok = await this.access.unlock(this.passwordDraft());
    if (ok) {
      this.passwordDraft.set('');
      this.notifications.success('Settings unlocked.');
    }
  }

  protected async lockSettings(): Promise<void> {
    await this.access.lock();
    this.fields.set([]);
    this.draft.set({});
    this.loadedFromDevice.set({});
    this.notifications.info('Settings locked.');
  }

  protected reload(): void {
    const device = this.devices.selectedRef();
    if (device && this.access.unlocked()) this.loadFields(device);
  }

  protected setDraft(fieldId: string, value: string | null | undefined): void {
    if (value === null || value === undefined || value === '') {
      this.draft.update((draft) => {
        const next = { ...draft };
        delete next[fieldId];
        return next;
      });
      return;
    }

    this.draft.update((draft) => ({ ...draft, [fieldId]: value }));
  }

  /**
   * ShineMonitor may return either the option key or its label. Controls must
   * always bind the key so mat-select and mat-radio can select the right item.
   */
  protected normalizeDeviceValue(field: ControlField, raw: string): string {
    const trimmed = raw.trim();
    if (!field.options.length) return trimmed;

    const byValue = field.options.find((option) => String(option.value) === trimmed);
    if (byValue) return String(byValue.value);

    const byLabel = field.options.find((option) => option.label === trimmed);
    if (byLabel) return String(byLabel.value);

    return trimmed;
  }

  protected async readCurrent(field: ControlField): Promise<void> {
    const device = this.devices.selectedRef();
    if (!device) return;

    this.busyFieldId.set(field.id);
    try {
      const current = await firstValueFrom(this.api.readValue(device, field.id));
      if (current.value === null || current.value.trim() === '') {
        this.notifications.info(`The inverter did not report a value for ${field.name}.`);
        return;
      }

      const normalized = this.normalizeDeviceValue(field, current.value);
      this.setDraft(field.id, normalized);
      this.loadedFromDevice.update((loaded) => ({ ...loaded, [field.id]: true }));

      const label =
        current.label ??
        field.options.find((option) => String(option.value) === normalized)?.label ??
        normalized;
      this.notifications.success(`${field.name} is currently ${label}.`);
    } catch (error) {
      this.notifications.error((error as Error).message);
    } finally {
      this.busyFieldId.set(null);
    }
  }

  protected async apply(field: ControlField): Promise<void> {
    const device = this.devices.selectedRef();
    const value = this.draft()[field.id];

    if (!device || value === undefined || value === '') {
      this.notifications.info('Read the current value or choose a setting before applying.');
      return;
    }

    const label = field.options.find((option) => option.value === value)?.label ?? value;
    const confirmed = await this.confirm({
      title: `Change ${field.name}?`,
      message: `${field.name} will be set to "${label}" on the inverter.`,
      confirmLabel: 'Apply setting',
    });
    if (!confirmed) return;

    this.busyFieldId.set(field.id);
    try {
      const result = await firstValueFrom(this.api.writeValue(device, field.id, value));

      if (result.success) {
        this.notifications.success(`${field.name} set to ${result.label ?? result.value}.`);
      } else {
        this.notifications.error(result.message ?? `The inverter rejected the change to ${field.name}.`);
      }
    } catch (error) {
      this.notifications.error((error as Error).message);
    } finally {
      this.busyFieldId.set(null);
    }
  }

  protected async applyProfile(): Promise<void> {
    const device = this.devices.selectedRef();
    if (!device) return;

    const confirmed = await this.confirm({
      title: 'Apply the preferred profile?',
      message: `${this.profileSteps().length} settings will be written to the inverter one after another.`,
      confirmLabel: 'Apply profile',
    });
    if (!confirmed) return;

    this.applyingProfile.set(true);
    this.profileResult.set(null);

    try {
      const result = await firstValueFrom(this.api.applyPreferredProfile(device));
      this.profileResult.set(result);

      if (result.applied === result.total) {
        this.notifications.success(`Applied all ${result.total} preferred settings.`);
      } else {
        this.notifications.error(`Applied ${result.applied} of ${result.total} settings. See the step results below.`);
      }
    } catch (error) {
      this.notifications.error((error as Error).message);
    } finally {
      this.applyingProfile.set(false);
    }
  }

  protected isLoaded(fieldId: string): boolean {
    return this.loadedFromDevice()[fieldId] === true;
  }

  protected displayLabel(field: ControlField): string | null {
    const value = this.draft()[field.id];
    if (!value) return null;

    return field.options.find((option) => String(option.value) === String(value))?.label ?? value;
  }

  protected draftValue(fieldId: string): string | null {
    return this.draft()[fieldId] ?? null;
  }

  private confirm(data: ConfirmDialogData): Promise<boolean> {
    return firstValueFrom(this.dialog.open(ConfirmDialog, { data, width: '28rem' }).afterClosed()).then(
      (result) => result === true,
    );
  }

  private loadFields(device: DeviceRef): void {
    this.loading.set(true);
    this.error.set(null);

    this.api.fields(device).subscribe({
      next: (fields) => {
        this.fields.set(fields);
        // Do not prefetch live values or pre-select defaults — each field loads on Read current.
        this.draft.set({});
        this.loadedFromDevice.set({});
        this.loading.set(false);
      },
      error: (error: Error) => {
        this.error.set(error.message);
        this.fields.set([]);
        this.loading.set(false);
      },
    });
  }
}
