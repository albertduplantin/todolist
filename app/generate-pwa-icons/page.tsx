'use client';

import { useEffect, useRef, useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function GeneratePWAIcons() {
  const canvasRef192 = useRef<HTMLCanvasElement>(null);
  const canvasRef512 = useRef<HTMLCanvasElement>(null);
  const [generated, setGenerated] = useState(false);

  useEffect(() => {
    generateIcons();
  }, []);

  const generateIcons = () => {
    const svgContent = `
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="115" fill="#3B82F6"/>
  <rect x="120" y="140" width="272" height="320" rx="12" fill="white"/>
  <path d="M180 140 C180 110 200 90 256 90 C312 90 332 110 332 140" 
        stroke="white" stroke-width="20" fill="none" stroke-linecap="round"/>
  <rect x="160" y="200" width="40" height="40" rx="8" fill="#3B82F6"/>
  <path d="M170 220 L185 235 L195 210" 
        stroke="white" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <line x1="220" y1="220" x2="340" y2="220" stroke="#9CA3AF" stroke-width="8" stroke-linecap="round"/>
  <rect x="160" y="270" width="40" height="40" rx="8" fill="#3B82F6"/>
  <path d="M170 290 L185 305 L195 280" 
        stroke="white" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <line x1="220" y1="290" x2="320" y2="290" stroke="#9CA3AF" stroke-width="8" stroke-linecap="round"/>
  <rect x="160" y="340" width="40" height="40" rx="8" fill="white" stroke="#D1D5DB" stroke-width="3"/>
  <line x1="220" y1="360" x2="340" y2="360" stroke="#D1D5DB" stroke-width="8" stroke-linecap="round"/>
  <rect x="160" y="410" width="40" height="40" rx="8" fill="white" stroke="#D1D5DB" stroke-width="3"/>
  <line x1="220" y1="430" x2="300" y2="430" stroke="#D1D5DB" stroke-width="8" stroke-linecap="round"/>
</svg>`;

    const img = new Image();
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      // Generate 192x192
      if (canvasRef192.current) {
        const ctx = canvasRef192.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, 192, 192);
          ctx.drawImage(img, 0, 0, 192, 192);
        }
      }

      // Generate 512x512
      if (canvasRef512.current) {
        const ctx = canvasRef512.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, 512, 512);
          ctx.drawImage(img, 0, 0, 512, 512);
        }
      }

      setGenerated(true);
      URL.revokeObjectURL(url);
    };

    img.src = url;
  };

  const downloadIcon = (size: number) => {
    const canvas = size === 192 ? canvasRef192.current : canvasRef512.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `icon-${size}x${size}.png`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  const downloadAll = async () => {
    downloadIcon(192);
    await new Promise(resolve => setTimeout(resolve, 500));
    downloadIcon(512);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="p-8">
          <h1 className="text-3xl font-bold mb-4">Générateur d'icônes PWA</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Téléchargez les icônes PNG pour installer TaskFlow comme une vraie application.
          </p>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* 192x192 Icon */}
            <div className="text-center">
              <h3 className="font-semibold mb-4">Icône 192x192</h3>
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-4 flex items-center justify-center">
                <canvas
                  ref={canvasRef192}
                  width={192}
                  height={192}
                  className="border border-gray-300 dark:border-gray-600 rounded-lg"
                />
              </div>
              <Button onClick={() => downloadIcon(192)} disabled={!generated}>
                <Download className="h-4 w-4 mr-2" />
                Télécharger 192x192
              </Button>
            </div>

            {/* 512x512 Icon */}
            <div className="text-center">
              <h3 className="font-semibold mb-4">Icône 512x512</h3>
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-4 flex items-center justify-center">
                <canvas
                  ref={canvasRef512}
                  width={512}
                  height={512}
                  className="border border-gray-300 dark:border-gray-600 rounded-lg max-w-[192px]"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>
              <Button onClick={() => downloadIcon(512)} disabled={!generated}>
                <Download className="h-4 w-4 mr-2" />
                Télécharger 512x512
              </Button>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
            <h2 className="text-xl font-semibold mb-4">Instructions d'installation</h2>
            <ol className="list-decimal list-inside space-y-4 text-gray-700 dark:text-gray-300">
              <li>
                <strong>Téléchargez les deux icônes</strong> en cliquant sur les boutons ci-dessus
              </li>
              <li>
                <strong>Renommez les fichiers</strong> :
                <ul className="list-disc list-inside ml-6 mt-2">
                  <li><code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">icon-192x192.png</code></li>
                  <li><code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">icon-512x512.png</code></li>
                </ul>
              </li>
              <li>
                <strong>Placez-les dans le dossier</strong> <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">public/</code> de votre projet
              </li>
              <li>
                <strong>Redéployez sur Vercel</strong>
              </li>
            </ol>

            <div className="mt-6 flex gap-4">
              <Button onClick={downloadAll} className="flex-1" disabled={!generated}>
                <Download className="h-4 w-4 mr-2" />
                Tout télécharger
              </Button>
              <Button onClick={() => window.location.href = '/'} variant="outline" className="flex-1">
                Retour à l'accueil
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

