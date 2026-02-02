import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Play, Download, RefreshCw, Phone, Eye, X, Pause, Loader2 } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { useToast } from '../../hooks/use-toast';
import { useIsMobile } from '../../hooks/use-mobile';
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerDescription, 
  DrawerTrigger,
  DrawerClose 
} from '../ui/drawer';
import { ScrollArea } from '../ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface CallLog {
  id: string;
  bland_call_id: string;
  recording_url: string | null;
  to_number: string;
  from_number: string;
  created_at: string;
  is_available: boolean;
  status: string | null;
  started_at: string | null;
  completed_at: string | null;
  duration_min: number | null;
  summary: string | null;
  transcript: string | null;
  raw: any;
}

const CallLogsTable = () => {
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [playingCallId, setPlayingCallId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const fetchCallLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('call_logs')
        .select('*')
        .eq('to_number', '+14156971849')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCallLogs(data || []);
    } catch (error) {
      console.error('Error fetching call logs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch call logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const syncCalls = async (testRange?: boolean) => {
    setSyncing(true);
    try {
      const requestBody = testRange ? {} : {}; // Default to 14 days for both
      const { data, error } = await supabase.functions.invoke('bland-sync-calls', {
        body: requestBody
      });
      
      if (error) throw error;

      // Handle structured error response
      if (data && !data.success) {
        const errorMessage = data.step 
          ? `Sync failed — ${data.step}: ${data.message}`
          : data.message || "Unknown error occurred";
        
        toast({
          title: "Sync Failed",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      // Success response
      const successMessage = data?.message || 
        `Synced ${data?.synced || 0} of ${data?.total || 0} calls`;
      
      toast({
        title: "Sync Complete",
        description: successMessage,
      });

      // Refresh the call logs
      await fetchCallLogs();
    } catch (error) {
      console.error('Error syncing calls:', error);
      toast({
        title: "Sync Failed",
        description: "Failed to sync call logs from Bland AI",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };


  const updateCallStatus = async (callId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('call_logs')
        .update({ status: newStatus })
        .eq('id', callId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Call status changed to ${newStatus}`,
      });

      // Update local state
      setCallLogs(prevLogs => 
        prevLogs.map(log => 
          log.id === callId ? { ...log, status: newStatus } : log
        )
      );
    } catch (error) {
      console.error('Error updating call status:', error);
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const playRecording = (url: string, callId: string) => {
    if (!url) return;

    // If already playing this audio, pause it
    if (playingCallId === callId && audioElement) {
      audioElement.pause();
      setPlayingCallId(null);
      return;
    }

    // If playing different audio, stop it first
    if (audioElement) {
      audioElement.pause();
    }

    // Create new audio element
    const audio = new Audio(url);
    audio.addEventListener('ended', () => {
      setPlayingCallId(null);
    });
    audio.addEventListener('error', () => {
      toast({
        title: "Playback Error",
        description: "Failed to play the recording",
        variant: "destructive",
      });
      setPlayingCallId(null);
    });

    audio.play();
    setAudioElement(audio);
    setPlayingCallId(callId);
    
    toast({
      title: "Playing Recording",
      description: "Audio playback started",
    });
  };

  const downloadRecording = (url: string, callId: string) => {
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = `recording-${callId}.wav`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return 'Unknown';
    // Format as (XXX) XXX-XXXX if 10 digits
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Los_Angeles',
    });
  };

  useEffect(() => {
    fetchCallLogs();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Phone className="w-5 h-5" />
            <span>Call Logs</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col space-y-3 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Phone className="w-5 h-5" />
              <span>Call Logs</span>
            </CardTitle>
            {!isMobile && (
              <CardDescription>
                Recent calls TO +14156971849 from Bland AI. Click sync to fetch the latest calls.
              </CardDescription>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              onClick={() => syncCalls()} 
              disabled={syncing}
              className="flex items-center space-x-2 w-full md:w-auto"
              size={isMobile ? "sm" : "default"}
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Syncing...' : 'Sync Calls'}</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {callLogs.length === 0 ? (
          <div className="text-center py-8">
            <Phone className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              No call logs found
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Click the sync button to fetch call logs TO +14156971849 from Bland AI
            </p>
            <Button 
              onClick={() => syncCalls()} 
              disabled={syncing}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Syncing...' : 'Sync Calls'}</span>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recording</TableHead>
                  {!isMobile && <TableHead>To</TableHead>}
                  <TableHead>From</TableHead>
                  {!isMobile && <TableHead>Duration</TableHead>}
                  {!isMobile && <TableHead>Status</TableHead>}
                  {!isMobile && <TableHead>Summary</TableHead>}
                  {!isMobile && <TableHead>Started</TableHead>}
                  {isMobile && <TableHead>Details</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {callLogs.map((call) => (
                  <TableRow key={call.id}>
                    <TableCell>
                      {call.recording_url ? (
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant={playingCallId === call.bland_call_id ? "default" : "ghost"}
                            onClick={() => playRecording(call.recording_url!, call.bland_call_id)}
                            className="h-8 w-8 p-0"
                            title={playingCallId === call.bland_call_id ? "Pause recording" : "Play recording"}
                          >
                            {playingCallId === call.bland_call_id ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </Button>
                          {!isMobile && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => downloadRecording(call.recording_url!, call.bland_call_id)}
                              className="h-8 w-8 p-0"
                              title="Download recording"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">No recording</span>
                      )}
                    </TableCell>
                    {!isMobile && (
                      <TableCell className="font-medium">
                        {formatPhoneNumber(call.to_number)}
                      </TableCell>
                    )}
                    <TableCell>
                      {formatPhoneNumber(call.from_number)}
                    </TableCell>
                    {!isMobile && (
                      <TableCell>
                        {call.duration_min ? `${call.duration_min} min` : '-'}
                      </TableCell>
                    )}
                     {!isMobile && (
                       <TableCell>
                         <Select
                           value={call.status || 'unknown'}
                           onValueChange={(value) => updateCallStatus(call.id, value)}
                         >
                           <SelectTrigger className="w-[130px] h-8">
                             <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                             <SelectItem value="customer">
                               <span className="flex items-center">
                                 <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                                 Customer
                               </span>
                             </SelectItem>
                             <SelectItem value="prospect">
                               <span className="flex items-center">
                                 <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                                 Prospect
                               </span>
                             </SelectItem>
                             <SelectItem value="spam">
                               <span className="flex items-center">
                                 <span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>
                                 Spam
                               </span>
                             </SelectItem>
                           </SelectContent>
                         </Select>
                       </TableCell>
                     )}
                    {!isMobile && (
                      <TableCell className="max-w-xs">
                        {call.summary || call.transcript ? (
                          <Drawer>
                            <DrawerTrigger asChild>
                              <div className="flex items-center space-x-2 cursor-pointer hover:bg-muted/50 p-1 rounded">
                                <div className="flex-1 min-w-0">
                                  {call.summary ? (
                                    <div className="truncate text-sm">
                                      {call.summary}
                                    </div>
                                  ) : (
                                    <div className="truncate text-sm text-muted-foreground">
                                      {call.transcript?.substring(0, 100)}...
                                    </div>
                                  )}
                                </div>
                                <Eye className="w-4 h-4 text-muted-foreground hover:text-foreground flex-shrink-0" />
                              </div>
                            </DrawerTrigger>
                            <DrawerContent className="max-h-[80vh]">
                              <DrawerHeader className="border-b">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <DrawerTitle className="text-left">Call Details</DrawerTitle>
                                    <DrawerDescription className="text-left">
                                      {formatPhoneNumber(call.from_number)} → {formatPhoneNumber(call.to_number)} • {formatDate(call.started_at || call.created_at)}
                                    </DrawerDescription>
                                  </div>
                                  <DrawerClose asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </DrawerClose>
                                </div>
                              </DrawerHeader>
                              <ScrollArea className="flex-1 px-6 py-4">
                                <div className="space-y-6">
                                  {/* Call Info */}
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <span className="font-medium text-muted-foreground">Duration:</span>
                                      <div>{call.duration_min ? `${call.duration_min} minutes` : 'N/A'}</div>
                                     </div>
                                     <div>
                                       <span className="font-medium text-muted-foreground mb-2 block">Status:</span>
                                       <Select
                                         value={call.status || 'unknown'}
                                         onValueChange={(value) => updateCallStatus(call.id, value)}
                                       >
                                         <SelectTrigger className="w-full h-9">
                                           <SelectValue />
                                         </SelectTrigger>
                                         <SelectContent>
                                           <SelectItem value="customer">
                                             <span className="flex items-center">
                                               <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                                               Customer
                                             </span>
                                           </SelectItem>
                                           <SelectItem value="prospect">
                                             <span className="flex items-center">
                                               <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                                               Prospect
                                             </span>
                                           </SelectItem>
                                           <SelectItem value="spam">
                                             <span className="flex items-center">
                                               <span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>
                                               Spam
                                             </span>
                                           </SelectItem>
                                         </SelectContent>
                                       </Select>
                                     </div>
                                  </div>
                                  
                                  {/* Summary */}
                                  {call.summary && (
                                    <div>
                                      <h4 className="font-semibold mb-2">Summary</h4>
                                      <div className="bg-muted/50 p-4 rounded-lg text-sm leading-relaxed">
                                        {call.summary}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Transcript */}
                                  {call.transcript && (
                                    <div>
                                      <h4 className="font-semibold mb-2">Transcript</h4>
                                      <div className="bg-muted/30 p-4 rounded-lg text-sm leading-relaxed whitespace-pre-wrap">
                                        {call.transcript}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {!call.summary && !call.transcript && (
                                    <div className="text-center py-8 text-muted-foreground">
                                      <Phone className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                      <p>No summary or transcript available for this call</p>
                                    </div>
                                  )}
                                </div>
                              </ScrollArea>
                            </DrawerContent>
                          </Drawer>
                        ) : (
                          <span className="text-muted-foreground text-sm">No summary</span>
                        )}
                      </TableCell>
                    )}
                    {!isMobile && (
                      <TableCell>
                        {call.started_at ? formatDate(call.started_at) : formatDate(call.created_at)}
                      </TableCell>
                    )}
                    {isMobile && (
                      <TableCell>
                        <Drawer>
                          <DrawerTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              title="View details"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DrawerTrigger>
                          <DrawerContent className="max-h-[80vh]">
                            <DrawerHeader className="border-b">
                              <div className="flex items-center justify-between">
                                <div>
                                  <DrawerTitle className="text-left">Call Details</DrawerTitle>
                                  <DrawerDescription className="text-left">
                                    {formatPhoneNumber(call.from_number)} → {formatPhoneNumber(call.to_number)} • {formatDate(call.started_at || call.created_at)}
                                  </DrawerDescription>
                                </div>
                                <DrawerClose asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <X className="w-4 h-4" />
                                  </Button>
                                </DrawerClose>
                              </div>
                            </DrawerHeader>
                            <ScrollArea className="flex-1 px-6 py-4">
                              <div className="space-y-6">
                                {/* Call Info */}
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="font-medium text-muted-foreground">Duration:</span>
                                    <div>{call.duration_min ? `${call.duration_min} minutes` : 'N/A'}</div>
                                  </div>
                                   <div>
                                     <span className="font-medium text-muted-foreground mb-2 block">Status:</span>
                                     <Select
                                       value={call.status || 'unknown'}
                                       onValueChange={(value) => updateCallStatus(call.id, value)}
                                     >
                                       <SelectTrigger className="w-full h-9">
                                         <SelectValue />
                                       </SelectTrigger>
                                       <SelectContent>
                                         <SelectItem value="customer">
                                           <span className="flex items-center">
                                             <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                                             Customer
                                           </span>
                                         </SelectItem>
                                         <SelectItem value="prospect">
                                           <span className="flex items-center">
                                             <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                                             Prospect
                                           </span>
                                         </SelectItem>
                                         <SelectItem value="spam">
                                           <span className="flex items-center">
                                             <span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>
                                             Spam
                                           </span>
                                         </SelectItem>
                                       </SelectContent>
                                     </Select>
                                   </div>
                                </div>
                                
                                {/* Summary */}
                                {call.summary && (
                                  <div>
                                    <h4 className="font-semibold mb-2">Summary</h4>
                                    <div className="bg-muted/50 p-4 rounded-lg text-sm leading-relaxed">
                                      {call.summary}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Transcript */}
                                {call.transcript && (
                                  <div>
                                    <h4 className="font-semibold mb-2">Transcript</h4>
                                    <div className="bg-muted/30 p-4 rounded-lg text-sm leading-relaxed whitespace-pre-wrap">
                                      {call.transcript}
                                    </div>
                                  </div>
                                )}
                                
                                {!call.summary && !call.transcript && (
                                  <div className="text-center py-8 text-muted-foreground">
                                    <Phone className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p>No summary or transcript available for this call</p>
                                  </div>
                                )}
                              </div>
                            </ScrollArea>
                          </DrawerContent>
                        </Drawer>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CallLogsTable;