/**
 * Identifies this process for the lifetime of the process. Clever Cloud sets
 * `INSTANCE_ID` on every scaler; anywhere else the pid keeps two local
 * processes apart. The live servers use it to tell their own Redis messages
 * from the ones published by the rest of the fleet, so it has to be unique.
 */
export const instanceId = process.env.INSTANCE_ID ?? `local-${process.pid}`;
