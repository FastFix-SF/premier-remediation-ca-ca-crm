import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Smartphone, Share2, MoreVertical } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useNavigate } from 'react-router-dom';
import SEOHead from '@/components/SEOHead';

const DownloadApp = () => {
  const navigate = useNavigate();
  const [isSpanish, setIsSpanish] = useState(false);

  const content = {
    en: {
      title: "Download Roofing Friend",
      subtitle: "Add our app to your phone in 3 easy steps",
      iosTitle: "iPhone / iPad",
      iosStep1: "Open this page in Safari browser",
      iosStep2: "Tap the Share button",
      iosStep3: "Scroll down and tap 'Add to Home Screen'",
      androidTitle: "Android",
      androidStep1: "Open this page in Chrome browser",
      androidStep2: "Tap the menu (⋮) in the top right",
      androidStep3: "Select 'Install app' or 'Add to Home screen'",
      getStarted: "Open App",
      language: "Español"
    },
    es: {
      title: "Descargar Roofing Friend",
      subtitle: "Agrega nuestra aplicación a tu teléfono en 3 pasos fáciles",
      iosTitle: "iPhone / iPad",
      iosStep1: "Abre esta página en el navegador Safari",
      iosStep2: "Toca el botón Compartir",
      iosStep3: "Desplázate hacia abajo y toca 'Agregar a pantalla de inicio'",
      androidTitle: "Android",
      androidStep1: "Abre esta página en el navegador Chrome",
      androidStep2: "Toca el menú (⋮) en la esquina superior derecha",
      androidStep3: "Selecciona 'Instalar aplicación' o 'Agregar a pantalla de inicio'",
      getStarted: "Abrir App",
      language: "English"
    }
  };

  const t = isSpanish ? content.es : content.en;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <SEOHead 
        title="Download App - Roofing Friend"
        description="Download the Roofing Friend mobile app for easy access to your work schedule, time tracking, and team communication."
      />
      
      <div className="container max-w-2xl mx-auto px-4 py-4">
        {/* Language Toggle */}
        <div className="flex items-center justify-end gap-2 mb-4 animate-fade-in">
          <span className={`text-xs font-medium transition-colors ${!isSpanish ? 'text-primary' : 'text-muted-foreground'}`}>
            English
          </span>
          <Switch
            checked={isSpanish}
            onCheckedChange={setIsSpanish}
            className="data-[state=checked]:bg-primary"
          />
          <span className={`text-xs font-medium transition-colors ${isSpanish ? 'text-primary' : 'text-muted-foreground'}`}>
            Español
          </span>
        </div>

        {/* Header */}
        <div className="text-center mb-4 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2 animate-scale-in">
            <Smartphone className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-1">{t.title}</h1>
          <p className="text-sm text-muted-foreground">
            {t.subtitle}
          </p>
        </div>

        {/* iOS Instructions */}
        <Card className="p-4 mb-3 animate-fade-in hover-scale">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-md">
              <Smartphone className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold">{t.iosTitle}</h2>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start gap-2 group">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shadow-sm group-hover:scale-110 transition-transform">
                1
              </div>
              <div className="flex-1 pt-0.5">
                <p className="text-sm font-medium">{t.iosStep1}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2 group">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                <Share2 className="w-4 h-4" />
              </div>
              <div className="flex-1 pt-0.5">
                <p className="text-sm font-medium">{t.iosStep2}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2 group">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shadow-sm group-hover:scale-110 transition-transform">
                3
              </div>
              <div className="flex-1 pt-0.5">
                <p className="text-sm font-medium">{t.iosStep3}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Android Instructions */}
        <Card className="p-4 mb-3 animate-fade-in hover-scale">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white shadow-md">
              <Smartphone className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold">{t.androidTitle}</h2>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start gap-2 group">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shadow-sm group-hover:scale-110 transition-transform">
                1
              </div>
              <div className="flex-1 pt-0.5">
                <p className="text-sm font-medium">{t.androidStep1}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2 group">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                <MoreVertical className="w-4 h-4" />
              </div>
              <div className="flex-1 pt-0.5">
                <p className="text-sm font-medium">{t.androidStep2}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2 group">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shadow-sm group-hover:scale-110 transition-transform">
                3
              </div>
              <div className="flex-1 pt-0.5">
                <p className="text-sm font-medium">{t.androidStep3}</p>
              </div>
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
};

export default DownloadApp;
