import "server-only";
/**
 * LocalStorageService — filesystem-backed StorageService for development and the
 * portable archive. Writes under a configured root (defaults to ./public/media,
 * which Next serves at /media). Swapped for a Supabase Storage implementation
 * later without touching any domain (ADR-0001).
 */
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { ok, err, UnavailableError, type Result } from "@shared/index";
import type {
  PutOptions,
  StorageService,
  StoredObject,
  UrlOptions,
} from "./storage.service";

const DEFAULT_ROOT = path.join(process.cwd(), "public", "media");
const PUBLIC_PREFIX = "/media";

export class LocalStorageService implements StorageService {
  readonly backend = "local";
  constructor(
    private readonly root: string = process.env.PLANET_B_MEDIA_ROOT ?? DEFAULT_ROOT,
    private readonly publicPrefix: string = PUBLIC_PREFIX
  ) {}

  private resolve(key: string): string {
    // Prevent path traversal outside the storage root.
    const safe = path.normalize(key).replace(/^(\.\.[/\\])+/, "");
    const full = path.join(this.root, safe);
    if (!full.startsWith(this.root)) {
      throw new Error(`Refusing key outside storage root: ${key}`);
    }
    return full;
  }

  async put(key: string, data: Uint8Array, _opts?: PutOptions): Promise<Result<StoredObject>> {
    try {
      const full = this.resolve(key);
      await fs.mkdir(path.dirname(full), { recursive: true });
      await fs.writeFile(full, data);
      const sha256 = createHash("sha256").update(data).digest("hex");
      return ok({ key, url: `${this.publicPrefix}/${key}`, bytes: data.byteLength, sha256 });
    } catch (e) {
      return err(new UnavailableError(`Local storage write failed for ${key}`, e));
    }
  }

  async get(key: string): Promise<Result<Uint8Array>> {
    try {
      const buf = await fs.readFile(this.resolve(key));
      return ok(new Uint8Array(buf));
    } catch (e) {
      return err(new UnavailableError(`Local storage read failed for ${key}`, e));
    }
  }

  async url(key: string, _opts?: UrlOptions): Promise<Result<string>> {
    // Local files are public; signing is a no-op here (Supabase will honor it).
    return ok(`${this.publicPrefix}/${key}`);
  }

  async exists(key: string): Promise<boolean> {
    try {
      await fs.access(this.resolve(key));
      return true;
    } catch {
      return false;
    }
  }

  async remove(key: string): Promise<Result<void>> {
    try {
      await fs.rm(this.resolve(key), { force: true });
      return ok(undefined);
    } catch (e) {
      return err(new UnavailableError(`Local storage remove failed for ${key}`, e));
    }
  }
}
