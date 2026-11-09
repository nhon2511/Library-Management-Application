import { useEffect, useId, useRef, useState } from 'react';
import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
  type CameraDevice,
} from 'html5-qrcode';
import { Camera, CameraOff, RefreshCw } from 'lucide-react';
import { Button } from './ui';

type ScannerProps = {
  onScan: (value: string) => void;
  label?: string;
  formats?: Html5QrcodeSupportedFormats[];
};

const scanFormats = [
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.EAN_13,
];

export function Scanner({ onScan, label = 'Camera', formats = scanFormats }: ScannerProps) {
  const scannerId = useId().replace(/:/g, '');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const onScanRef = useRef(onScan);
  const scannedRef = useRef(false);
  const [active, setActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [error, setError] = useState('');

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!active) return;
    let disposed = false;
    const scanner = new Html5Qrcode(scannerId, { verbose: false });
    scannerRef.current = scanner;
    scannedRef.current = false;
    setError('');

    const start = async () => {
      const config = {
        fps: 10,
        qrbox: { width: 260, height: 180 },
        formatsToSupport: formats,
        aspectRatio: 1.333334,
      };

      try {
        await scanner.start(
          { facingMode },
          config,
          async (decodedText) => {
            if (scannedRef.current || disposed) return;
            scannedRef.current = true;
            onScanRef.current(decodedText);
            await scanner.stop().catch(() => undefined);
            if (!disposed) setActive(false);
          },
          () => undefined,
        );
      } catch {
        try {
          const cameras: CameraDevice[] = await Html5Qrcode.getCameras();
          const camera = cameras.find((item) =>
            facingMode === 'environment'
              ? /back|rear|environment/i.test(item.label)
              : /front|user/i.test(item.label),
          );
          if (!camera) throw new Error('No camera');
          await scanner.start(camera.id, config, (decodedText) => {
            if (scannedRef.current || disposed) return;
            scannedRef.current = true;
            onScanRef.current(decodedText);
            void scanner.stop().catch(() => undefined);
            if (!disposed) setActive(false);
          }, () => undefined);
        } catch {
          setError('Không thể truy cập camera. Hãy cấp quyền camera và thử lại.');
          setActive(false);
        }
      }
    };

    void start();
    return () => {
      disposed = true;
      if (scannerRef.current?.isScanning) {
        void scannerRef.current.stop().catch(() => undefined);
      }
      scannerRef.current = null;
    };
  }, [active, facingMode, formats, scannerId]);

  const toggleCamera = () => {
    setFacingMode((current) => (current === 'environment' ? 'user' : 'environment'));
    setActive(true);
  };

  return (
    <div className="scanner-box">
      <div className="scanner-actions">
        <Button
          type="button"
          variant={active ? 'danger' : 'secondary'}
          onClick={() => setActive((current) => !current)}
          aria-pressed={active}
        >
          {active ? <CameraOff size={16} /> : <Camera size={16} />}
          {active ? 'Tắt camera' : label}
        </Button>
        {active && (
          <Button type="button" variant="ghost" onClick={toggleCamera} title="Đổi camera">
            <RefreshCw size={16} /> Đổi camera
          </Button>
        )}
      </div>
      {active && (
        <div className="scanner-viewport">
          <div id={scannerId} />
          <span className="scanner-reticle" aria-hidden="true" />
          <small>Đưa QR hoặc barcode vào khung ngắm</small>
        </div>
      )}
      {error && <small className="field-error">{error}</small>}
    </div>
  );
}
