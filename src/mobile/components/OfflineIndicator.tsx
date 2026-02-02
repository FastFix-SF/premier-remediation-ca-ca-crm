import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Upload } from 'lucide-react';
import { offlineQueue } from '@/lib/offline-queue';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueCounts, setQueueCounts] = useState({ photos: 0, notes: 0, total: 0 });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const updateQueueCounts = async () => {
      try {
        const counts = await offlineQueue.getQueueCounts();
        setQueueCounts(counts);
      } catch (error) {
        console.error('Failed to get queue counts:', error);
      }
    };

    updateQueueCounts();
    const interval = setInterval(updateQueueCounts, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  if (isOnline && queueCounts.total === 0) {
    return null; // Don't show anything when online and no queue
  }

  return (
    <div className={`px-4 py-2 text-xs flex items-center justify-center space-x-2 ${
      isOnline ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'
    }`}>
      {isOnline ? (
        <>
          <Wifi className="w-4 h-4" />
          {queueCounts.total > 0 && (
            <>
              <Upload className="w-4 h-4" />
              <span>Syncing {queueCounts.total} items...</span>
            </>
          )}
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4" />
          <span>Offline</span>
          {queueCounts.total > 0 && (
            <span>• {queueCounts.total} items queued</span>
          )}
        </>
      )}
    </div>
  );
};