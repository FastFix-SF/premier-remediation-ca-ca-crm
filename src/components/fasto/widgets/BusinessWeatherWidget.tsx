import React from 'react';
import { Cloud, Sun, CloudRain, Thermometer } from 'lucide-react';

export const BusinessWeatherWidget = () => {
  // Mock weather data - in production, integrate with a weather API
  const weather = {
    temp: 62,
    condition: 'Partly Cloudy',
    high: 68,
    low: 54,
    humidity: 45,
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'sunny':
      case 'clear':
        return Sun;
      case 'rainy':
      case 'rain':
        return CloudRain;
      default:
        return Cloud;
    }
  };

  const WeatherIcon = getWeatherIcon(weather.condition);

  return (
    <div className="h-full bg-gradient-to-br from-sky-500/20 to-blue-600/20 backdrop-blur-xl rounded-3xl border border-white/10 p-5 flex flex-col justify-between">
      {/* Current Weather */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-4xl font-light text-white">{weather.temp}°</p>
          <p className="text-white/60 text-sm mt-1">{weather.condition}</p>
        </div>
        <WeatherIcon className="w-10 h-10 text-white/70" />
      </div>

      {/* Details */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/50">High / Low</span>
          <span className="text-white/80">{weather.high}° / {weather.low}°</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/50">Humidity</span>
          <span className="text-white/80">{weather.humidity}%</span>
        </div>
      </div>

      {/* Work Conditions */}
      <div className="pt-3 mt-3 border-t border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-400 rounded-full" />
          <span className="text-xs text-white/60">Good conditions for roofing</span>
        </div>
      </div>
    </div>
  );
};
