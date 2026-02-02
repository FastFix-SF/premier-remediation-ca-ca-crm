import React from 'react';
import { Cloud, CloudRain, CloudSnow, Sun, CloudSun, Wind } from 'lucide-react';

interface WeatherWidgetProps {
  weatherData: {
    condition?: string;
    temp_high?: number;
    temp_low?: number;
    notes?: string;
  };
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ weatherData }) => {
  const getWeatherIcon = (condition?: string) => {
    if (!condition) return <Sun className="w-8 h-8 text-yellow-500" />;
    
    const lower = condition.toLowerCase();
    if (lower.includes('rain') || lower.includes('shower')) {
      return <CloudRain className="w-8 h-8 text-blue-500" />;
    }
    if (lower.includes('snow') || lower.includes('ice')) {
      return <CloudSnow className="w-8 h-8 text-blue-300" />;
    }
    if (lower.includes('cloud') || lower.includes('overcast')) {
      return <Cloud className="w-8 h-8 text-gray-500" />;
    }
    if (lower.includes('partly') || lower.includes('partial')) {
      return <CloudSun className="w-8 h-8 text-yellow-400" />;
    }
    if (lower.includes('wind')) {
      return <Wind className="w-8 h-8 text-gray-600" />;
    }
    return <Sun className="w-8 h-8 text-yellow-500" />;
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">
          {getWeatherIcon(weatherData.condition)}
        </div>
        <div className="flex-1">
          <p className="text-lg font-semibold text-foreground">
            {weatherData.condition || 'No weather data'}
          </p>
          {(weatherData.temp_high !== undefined || weatherData.temp_low !== undefined) && (
            <p className="text-sm text-muted-foreground">
              {weatherData.temp_high !== undefined && (
                <span>High: {weatherData.temp_high}°F</span>
              )}
              {weatherData.temp_high !== undefined && weatherData.temp_low !== undefined && ' / '}
              {weatherData.temp_low !== undefined && (
                <span>Low: {weatherData.temp_low}°F</span>
              )}
            </p>
          )}
        </div>
      </div>
      {weatherData.notes && (
        <p className="mt-2 text-sm text-muted-foreground border-t border-blue-200 dark:border-blue-700 pt-2">
          {weatherData.notes}
        </p>
      )}
    </div>
  );
};
