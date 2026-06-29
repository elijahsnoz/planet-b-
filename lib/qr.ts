import "server-only";
import QRCode from "qrcode";

/**
 * A scannable verification QR for a Planet Passport, rendered server-side as an
 * inline SVG (no client runtime, no external image). Always dark-on-white so it
 * scans regardless of the surrounding theme — the QR is an official mark, set
 * into its own museum-label tile. Returns the inner SVG markup as a string.
 */
export async function passportQrSvg(text: string): Promise<string> {
  return QRCode.toString(text, {
    type: "svg",
    margin: 0,
    errorCorrectionLevel: "M",
    color: { dark: "#0b0b0c", light: "#00000000" },
  });
}
