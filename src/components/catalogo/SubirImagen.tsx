import { useStore } from '@nanostores/react';
import { useState, type ChangeEvent, type DragEvent } from 'react';
import { negocio } from '../../config/negocio';
import { esHeic, MENSAJE_HEIC, validarArchivo } from '../../lib/archivo';
import { $imagenPropia, ponerImagenPropia } from '../../stores/vitrina';
import { abrirFoto } from '../configurador/imagen';

// Zona para soltar una imagen y verla colgada en la pared de la portada. La imagen se reduce a la
// vista previa de ~2000 px y no sale del navegador. El recorte y el aviso de calidad viven en /crear.

export default function SubirImagen() {
  const propia = useStore($imagenPropia);
  const [encima, setEncima] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function usar(archivo: File | undefined) {
    if (!archivo) return;
    setError(null);
    const validacion = validarArchivo(archivo, negocio.archivo);
    if (!validacion.ok && validacion.motivo !== 'heic') return setError(validacion.mensaje);
    setCargando(true);
    try {
      const { vistaPrevia } = await abrirFoto(archivo);
      ponerImagenPropia({ url: vistaPrevia, nombre: archivo.name });
    } catch {
      setError(
        esHeic(archivo)
          ? MENSAJE_HEIC
          : 'No pudimos abrir esa imagen. Prueba con otra o envíala por WhatsApp.',
      );
    } finally {
      setCargando(false);
    }
  }

  function alElegir(e: ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    void usar(archivo);
  }

  function alSoltar(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setEncima(false);
    void usar(e.dataTransfer.files[0]);
  }

  return (
    <div>
      <label
        onDragEnter={(e) => {
          e.preventDefault();
          setEncima(true);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={() => setEncima(false)}
        onDrop={alSoltar}
        className={`group relative grid aspect-[4/3] cursor-pointer place-items-center border border-dashed p-6 text-center transition-colors duration-[350ms] focus-within:border-texto hover:border-texto ${
          encima ? 'border-texto bg-white' : 'border-texto/35 bg-[#fbfaf7]'
        }`}
      >
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
          onChange={alElegir}
          className="sr-only"
          data-testid="subir-imagen"
        />
        {propia ? (
          <img
            src={propia.url}
            alt="Tu imagen"
            className="absolute inset-4 size-[calc(100%-2rem)] object-contain"
          />
        ) : (
          <span>
            <span
              aria-hidden="true"
              className="font-display mb-3 block text-[44px] leading-none text-acento-fuerte transition-transform duration-[400ms] group-hover:rotate-90"
            >
              +
            </span>
            <span className="font-display block text-[1.625rem] leading-tight">
              {cargando ? 'Abriendo tu imagen…' : 'Sube tu imagen'}
            </span>
            <span className="mx-auto mt-2 block max-w-[34ch] text-sm text-texto-suave">
              Arrástrala aquí o tócala para elegir. Se queda en tu navegador y aparece colgada en la
              pared.
            </span>
          </span>
        )}
      </label>
      <p role="status" aria-live="polite" className="mt-3 text-sm empty:hidden">
        {error ?? (propia ? `${propia.nombre} está colgada en la pared.` : '')}
      </p>
      {propia && (
        <a href="#pared" className="enlace-fuerte">
          Verla en la pared <span aria-hidden="true">↑</span>
        </a>
      )}
    </div>
  );
}
