import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { MessageCircle, AlertTriangle, TrendingUp, Clock } from 'lucide-react';
import { supabase } from '../../../integrations/supabase/client';

interface ChatInsight {
  id: string;
  title: string;
  description: string;
  impact_amount?: number;
  impact_type?: string;
  confidence_score: number;
  data_sources: string[];
  action_items: string[];
  created_at: string;
}

interface ChatMetrics {
  total_messages: number;
  important_messages: number;
  delay_mentions: number;
  recent_activity: number;
}

const ChatInsights = () => {
  const [insights, setInsights] = useState<ChatInsight[]>([]);
  const [metrics, setMetrics] = useState<ChatMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChatInsights();
    fetchChatMetrics();
  }, []);

  const fetchChatInsights = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_workforce_insights')
        .select('*')
        .in('insight_type', ['schedule_risk', 'communication_issue'])
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setInsights((data || []).map(item => ({
        ...item,
        data_sources: Array.isArray(item.data_sources) ? item.data_sources.map(String) : [],
        action_items: Array.isArray(item.action_items) ? item.action_items.map(String) : []
      })));
    } catch (error) {
      console.error('Error fetching chat insights:', error);
    }
  };

  const fetchChatMetrics = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from('team_chats')
        .select('*')
        .gte('timestamp', startDate.toISOString());

      if (error) throw error;

      const chats = data || [];
      const delayKeywords = ['delay', 'permit', 'weather', 'material', 'postpone', 'reschedule'];
      
      setMetrics({
        total_messages: chats.length,
        important_messages: chats.filter(chat => chat.is_important).length,
        delay_mentions: chats.filter(chat => 
          delayKeywords.some(keyword => 
            chat.message.toLowerCase().includes(keyword)
          )
        ).length,
        recent_activity: chats.filter(chat => 
          new Date(chat.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
        ).length
      });
    } catch (error) {
      console.error('Error fetching chat metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'schedule_risk':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'communication_issue':
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <TrendingUp className="w-4 h-4 text-emerald-500" />;
    }
  };

  const getImpactBadge = (type?: string, amount?: number) => {
    if (!type || !amount) return null;
    
    const color = type === 'cost_increase' ? 'destructive' : 
                  type === 'time_delay' ? 'secondary' : 'default';
    
    return (
      <Badge variant={color} className="ml-2">
        ${amount.toLocaleString()}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Chat Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Messages</p>
                  <p className="text-2xl font-bold">{metrics.total_messages}</p>
                </div>
                <MessageCircle className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Important</p>
                  <p className="text-2xl font-bold text-amber-600">{metrics.important_messages}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Delay Mentions</p>
                  <p className="text-2xl font-bold text-red-600">{metrics.delay_mentions}</p>
                </div>
                <Clock className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Last 24h</p>
                  <p className="text-2xl font-bold text-emerald-600">{metrics.recent_activity}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* AI-Generated Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Chat Analysis & Insights
          </CardTitle>
          <CardDescription>
            AI-powered analysis of team communications and their impact on project profitability
          </CardDescription>
        </CardHeader>
        <CardContent>
          {insights.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No recent insights available</p>
              <p className="text-sm">Chat analysis will appear here as data is processed</p>
            </div>
          ) : (
            <div className="space-y-4">
              {insights.map((insight) => (
                <div key={insight.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getInsightIcon(insight.title)}
                      <h3 className="font-semibold">{insight.title}</h3>
                      {getImpactBadge(insight.impact_type, insight.impact_amount)}
                    </div>
                    <Badge variant="outline">
                      {Math.round(insight.confidence_score * 100)}% confidence
                    </Badge>
                  </div>
                  
                  <p className="text-muted-foreground mb-3">{insight.description}</p>
                  
                  {insight.action_items.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-1">Recommended Actions:</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {insight.action_items.map((item, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-primary">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatInsights;