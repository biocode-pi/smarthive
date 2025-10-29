import { EventEmitter } from "events";
export const alertBus = new EventEmitter();

// Helper para emitir sempre objeto “plain”
export function emitAlert(alertDoc) {
  try {
    const plain = JSON.parse(JSON.stringify(alertDoc));
    alertBus.emit("alert", plain);
  } catch {
    alertBus.emit("alert", alertDoc);
  }
}
