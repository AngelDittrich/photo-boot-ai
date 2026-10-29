# Photo Boot AI

Interfaz web para capturar datasets de fotografías destinados a entrenar modelos de clasificación de objetos.

La app accede a la cámara, hace una cuenta regresiva de 3 segundos y captura una ráfaga de fotos mientras giras el objeto sobre un plato. Cada foto se recorta al centro, se reduce, se convierte a escala de grises y se comprime en JPEG antes de guardarse en su propia carpeta dentro de `datasets/`.

## Características

- Selección de cámara entre los dispositivos detectados.
- Configuración por sesión: cantidad de fotos, duración, resolución, calidad JPEG y color/grises.
- Cuenta regresiva de 3 s con sonidos y feedback visual.
- Guía de rotación de 360° para girar el objeto de forma uniforme.
- Captura automática con progreso, contador y opción de detener y guardar como sesión parcial.
- Recorte cuadrado central, redimensionado y compresión en el navegador.
- Guardado inmediato de cada foto en el servidor local.
- Una carpeta independiente por sesión con su `metadata.json`.
- Resumen final con carpeta, fotos guardadas, peso y duración.

Valores por defecto: **50 fotos en 10 s, 224×224 px, escala de grises, JPEG calidad 0.75**. Se estiman ~0.5–0.8 MB por sesión.

## Requisitos

- Node.js 20 o superior.
- Chrome, Edge o Safari actualizado.
- Cámara web.
- Abrir la app en `localhost` (contexto seguro para `getUserMedia`) o servirla por HTTPS.

## Instalación y uso

```bash
npm install
npm run dev
```

Abre <http://localhost:5173>.

1. Escribe la etiqueta del objeto (por ejemplo `taza-blanca`).
2. Elige la cámara y ajusta los parámetros si hace falta.
3. Pulsa **Iniciar captura**.
4. Espera la cuenta regresiva y gira el plato lento y constante durante la captura.
5. Al terminar, revisa la carpeta indicada en `datasets/`.

Cada nueva captura genera una carpeta nueva, aunque uses la misma etiqueta.

### Producción

```bash
npm run build
npm start
```

La app queda disponible en <http://localhost:3001>, servida por Express.

## Estructura del dataset

```text
datasets/
└── taza-blanca-20261026-180412/
    ├── metadata.json
    ├── frame_000.jpg
    ├── frame_001.jpg
    └── ... frame_049.jpg
```

Ejemplo de `metadata.json`:

```json
{
  "id": "taza-blanca-20261026-180412",
  "label": "taza-blanca",
  "notes": "Luz difusa, fondo oscuro",
  "status": "completed",
  "createdAt": "2026-10-26T18:04:12.000Z",
  "completedAt": "2026-10-26T18:04:26.000Z",
  "colorSpace": "grayscale",
  "settings": {
    "count": 50,
    "durationMs": 10000,
    "size": 224,
    "quality": 0.75,
    "grayscale": true
  },
  "camera": {
    "deviceId": "...",
    "label": "FaceTime HD Camera"
  },
  "frames": [
    { "index": 0, "file": "frame_000.jpg", "timeMs": 4, "bytes": 9123 }
  ],
  "capturedCount": 50,
  "uploadedCount": 50,
  "failedCount": 0,
  "totalBytes": 458210,
  "actualDurationMs": 10008
}
```

## Consejos para un dataset útil

- **Iluminación**: usa luz difusa y constante. Evita cambiar de luz entre sesiones del mismo objeto.
- **Fondo**: mantén el mismo fondo y distancia para todas las fotos de una clase.
- **Rotación**: gira a velocidad constante. Si aparecen fotos borrosas, reduce la cantidad de fotos o aumenta la duración (por ejemplo 30 fotos en 10 s) y mejora la iluminación.
- **Encuadre**: mantén el objeto centrado dentro del recuadro de captura.
- **Sesiones**: para un mismo objeto, haz varias sesiones (distintos ángulos, fondos o condiciones) y usa la misma etiqueta.
- **Balance de clases**: captura una cantidad similar de sesiones por clase.
- **Pestaña visible**: no cambies de pestaña durante la captura; los navegadores ralentizan los timers en segundo plano.
- **Grises**: el JPG se guarda con valores de gris. Si tu pipeline necesita un canal real, conviértelo al cargar (`Image.convert("L")` en Pillow, por ejemplo).

## Scripts

| Script | Descripción |
| --- | --- |
| `npm run dev` | Vite + servidor Express con recarga |
| `npm run dev:client` | Solo el frontend en `localhost:5173` |
| `npm run dev:server` | Solo la API en `localhost:3001` |
| `npm run build` | Compila el frontend en `dist/` |
| `npm start` | Sirve `dist/` y la API desde Express |

## API local

- `GET /api/health`
- `POST /api/sessions` — crea la carpeta y la metadata.
- `POST /api/sessions/:id/frames` — guarda una foto (`multipart/form-data`, campo `frame`).
- `PATCH /api/sessions/:id` — finaliza la sesión como `completed` o `partial`.

## Problemas comunes

- **Permiso denegado**: habilita la cámara para `localhost` en los ajustes del navegador.
- **La cámara está en uso**: cierra otras apps de videollamada o pestañas que la estén usando.
- **No aparece la cámara**: pulsa el botón de recargar junto al selector. En macOS revisa los permisos de cámara del navegador.
- **Fotos borrosas**: mejora la luz, gira más despacio o baja la cantidad de fotos.
- **El servidor no guarda**: confirma que `npm run dev` está activo y que la carpeta `datasets/` tiene permisos de escritura.

## Privacidad

Todo se guarda localmente en `datasets/`. El proyecto no sube imágenes a ningún servicio externo.
