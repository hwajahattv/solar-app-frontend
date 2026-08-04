export interface Device {
  pn: string;
  sn: string;
  devcode: string;
  devaddr: string;
  alias: string;
  plantId?: string;
  batterySoc?: number | null;
  energyToday?: number | null;
  outputPower?: number | null;
  status?: string;
}

/** The identifier subset every device-scoped endpoint requires. */
export type DeviceRef = Pick<Device, 'pn' | 'sn' | 'devcode' | 'devaddr'>;

export function toDeviceRef(device: Device): DeviceRef {
  return { pn: device.pn, sn: device.sn, devcode: device.devcode, devaddr: device.devaddr };
}
