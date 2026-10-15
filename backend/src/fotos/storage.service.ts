import { Injectable, InternalServerErrorException } from '@nestjs/common';

// Cliente mínimo de Supabase Storage (REST). Bucket PRIVADO: las fotos se muestran con
// URLs firmadas que expiran, así nadie puede abrirlas solo con adivinar la ruta.
@Injectable()
export class StorageService {
  private get url() { return (process.env.SUPABASE_URL || '').replace(/\/$/, ''); }
  private get key() { return process.env.SUPABASE_SERVICE_KEY || ''; }
  // Claves nuevas (sb_secret_...) van solo en `apikey`; la legacy service_role (JWT, empieza con eyJ) también en Authorization
  private get headersAuth(): Record<string, string> {
    const h: Record<string, string> = { apikey: this.key };
    if (this.key.startsWith('eyJ')) h.Authorization = `Bearer ${this.key}`;
    return h;
  }
  private get bucket() { return process.env.SUPABASE_BUCKET || 'fotos-alumnos'; }

  private verificarConfig() {
    if (!this.url || !this.key) {
      throw new InternalServerErrorException('Almacenamiento de fotos no configurado (SUPABASE_URL / SUPABASE_SERVICE_KEY)');
    }
  }

  async subir(ruta: string, buffer: Buffer, contentType: string) {
    this.verificarConfig();
    const res = await fetch(`${this.url}/storage/v1/object/${this.bucket}/${ruta}`, {
      method: 'POST',
      headers: { ...this.headersAuth, 'Content-Type': contentType, 'x-upsert': 'false' },
      body: buffer as any, // Buffer es válido en runtime; el tipo de fetch de TS no lo reconoce
    });
    if (!res.ok) {
      const detalle = await res.text().catch(() => '');
      console.error('[Storage] subir falló', res.status, detalle);
      throw new InternalServerErrorException(`No se pudo subir la foto (${res.status}): ${detalle.slice(0, 200)}`);
    }
  }

  async borrar(ruta: string) {
    this.verificarConfig();
    await fetch(`${this.url}/storage/v1/object/${this.bucket}/${ruta}`, {
      method: 'DELETE',
      headers: this.headersAuth,
    });
  }

  // URLs firmadas para varias rutas a la vez (1 hora de vigencia)
  async urlsFirmadas(rutas: string[], segundos = 3600): Promise<Record<string, string>> {
    if (rutas.length === 0) return {};
    this.verificarConfig();
    const res = await fetch(`${this.url}/storage/v1/object/sign/${this.bucket}`, {
      method: 'POST',
      headers: { ...this.headersAuth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ expiresIn: segundos, paths: rutas }),
    });
    if (!res.ok) {
      const detalle = await res.text().catch(() => '');
      console.error('[Storage] firmar falló', res.status, detalle);
      throw new InternalServerErrorException(`No se pudieron firmar las fotos (${res.status}): ${detalle.slice(0, 200)}`);
    }
    const data = (await res.json()) as Array<{ path: string; signedURL: string | null }>;
    const out: Record<string, string> = {};
    for (const d of data) if (d.signedURL) out[d.path] = `${this.url}/storage/v1${d.signedURL}`;
    return out;
  }
}
