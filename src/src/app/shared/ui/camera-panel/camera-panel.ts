import { ChangeDetectionStrategy, Component, inject, OnDestroy, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { CameraApiService } from '../../../core/api/camera-api.service';

type CameraState = 'idle' | 'connecting' | 'live' | 'error' | 'unavailable';

/**
 * MJPEG viewer. The stream is a plain <img> pointed at the gateway, which keeps
 * it playable by any client that can render an image — including native mobile
 * and TV shells that have no WebRTC stack.
 */
@Component({
  selector: 'app-camera-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './camera-panel.html',
  styleUrl: './camera-panel.scss',
})
export class CameraPanel implements OnDestroy {
  private readonly api = inject(CameraApiService);

  protected readonly state = signal<CameraState>('idle');
  protected readonly streamUrl = signal<string | null>(null);
  protected readonly message = signal<string>('Checking camera availability…');

  constructor() {
    this.api.status().subscribe({
      next: (status) => {
        if (status.configured) {
          this.start();
        } else {
          this.state.set('unavailable');
          this.message.set('No camera is configured on this deployment.');
        }
      },
      error: () => {
        this.state.set('unavailable');
        this.message.set('Camera status is unavailable.');
      },
    });
  }

  ngOnDestroy(): void {
    // Dropping the src closes the multipart connection, which stops the
    // transcoder on the gateway rather than leaving it running.
    this.streamUrl.set(null);
  }

  protected start(): void {
    this.state.set('connecting');
    this.message.set('Connecting to the camera…');
    this.streamUrl.set(this.api.streamUrl());
  }

  protected stop(): void {
    this.streamUrl.set(null);
    this.state.set('idle');
    this.message.set('Camera stopped.');
  }

  protected toggle(): void {
    if (this.state() === 'live' || this.state() === 'connecting') {
      this.stop();
    } else {
      this.start();
    }
  }

  protected openSnapshot(): void {
    globalThis.open?.(this.api.snapshotUrl(), '_blank');
  }

  protected onLoad(): void {
    this.state.set('live');
  }

  protected onError(): void {
    this.streamUrl.set(null);
    this.state.set('error');
    this.message.set('Camera unreachable. Check that it is online, then retry.');
  }
}
