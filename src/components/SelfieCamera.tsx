import React, { useState, useEffect, useRef } from 'react';
import { Camera, RefreshCw } from 'lucide-react';

interface SelfieCameraProps {
  selfie: string | null;
  onSelfie: (v: string | null) => void;
  /** true → preview lebih pendek (dashboard home); false → 4:3 penuh (tab absensi) */
  compact?: boolean;
}

/* ══════════════════════════════════════════════════════
   KAMERA SELFIE — reusable (dashboard home & tab absensi).
   Foto hanya untuk verifikasi diri di layar — TIDAK
   dikirim ke server (sama seperti perilaku AbsensiView).
   ══════════════════════════════════════════════════════ */
export const SelfieCamera: React.FC<SelfieCameraProps> = ({ selfie, onSelfie, compact = false }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [camOn, setCamOn] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);

  const startCam = async () => {
    setCamError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 } },
        audio: false,
      });
      streamRef.current = stream;
      setCamOn(true);
    } catch {
      setCamOn(false);
      setCamError('Kamera tidak tersedia / izin ditolak.');
    }
  };

  useEffect(() => {
    startCam();
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (camOn && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [camOn, selfie]);

  const capture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    onSelfie(canvas.toDataURL('image/jpeg', 0.8));
  };

  return (
    <div className={`relative rounded-[16px] overflow-hidden bg-navy ${compact ? 'aspect-[16/9]' : 'aspect-[4/3]'}`}>
      {selfie ? (
        <img src={selfie} alt="Selfie" className="w-full h-full object-cover -scale-x-100" />
      ) : (
        <video ref={videoRef} playsInline muted
          className={`w-full h-full object-cover -scale-x-100 ${camOn ? '' : 'opacity-0'}`} />
      )}

      {camError && !selfie && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-6">
          <Camera className="w-6 h-6 text-white/50" />
          <p className="text-[10px] font-semibold text-white/60">{camError}</p>
          <button onClick={startCam} className="px-3 py-1.5 rounded-full bg-white text-navy text-[10px] font-extrabold active:scale-95 transition-all">
            Coba Lagi
          </button>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-2.5 flex justify-center">
        {selfie ? (
          <button
            onClick={() => onSelfie(null)}
            className="px-3.5 py-1.5 rounded-full bg-white text-navy text-[10px] font-extrabold shadow-md active:scale-95 transition-all flex items-center gap-1.5"
          >
            <RefreshCw className="w-3 h-3" /> Ulangi Foto
          </button>
        ) : (
          <button
            onClick={capture}
            disabled={!camOn}
            aria-label="Ambil foto"
            className="w-11 h-11 rounded-full bg-white border-[3px] border-navy/20 shadow-md active:scale-90 transition-all disabled:opacity-40 flex items-center justify-center"
          >
            <Camera className="w-5 h-5 text-navy" />
          </button>
        )}
      </div>
    </div>
  );
};
