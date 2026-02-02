import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Settings,
  Bell,
  Moon,
  Globe,
  Shield,
  MessageSquare,
  Send,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface CCSettingsViewProps {
  memberId: string | null;
}

export const CCSettingsView: React.FC<CCSettingsViewProps> = ({ memberId }) => {
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: true,
    soundAlerts: false,
    emailDigest: true,
    language: 'en',
  });

  const [feedback, setFeedback] = useState({
    category: 'general',
    message: '',
    submitting: false,
    submitted: false,
  });

  const handleSettingChange = (key: string, value: boolean | string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    toast.success('Setting updated');
  };

  const handleSubmitFeedback = async () => {
    if (!feedback.message.trim() || !memberId) return;

    setFeedback((prev) => ({ ...prev, submitting: true }));

    const { error } = await supabase.from('admin_feedback').insert({
      user_id: memberId,
      feedback_text: feedback.message,
      category: feedback.category,
      status: 'pending',
    });

    if (!error) {
      setFeedback({
        category: 'general',
        message: '',
        submitting: false,
        submitted: true,
      });

      setTimeout(() => {
        setFeedback((prev) => ({ ...prev, submitted: false }));
      }, 3000);

      toast.success('Feedback submitted successfully!');
    } else {
      setFeedback((prev) => ({ ...prev, submitting: false }));
      toast.error('Failed to submit feedback');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="command-glass-card p-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-500 to-slate-600 flex items-center justify-center">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <p className="text-white/60">Customize your experience</p>
          </div>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notifications Settings */}
        <Card className="command-widget p-6 border-0">
          <div className="flex items-center gap-2 mb-6">
            <Bell className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-semibold text-white">Notifications</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white">Push Notifications</p>
                <p className="text-white/40 text-sm">Receive notifications in-app</p>
              </div>
              <Switch
                checked={settings.notifications}
                onCheckedChange={(v) => handleSettingChange('notifications', v)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-white">Sound Alerts</p>
                <p className="text-white/40 text-sm">Play sound for new notifications</p>
              </div>
              <Switch
                checked={settings.soundAlerts}
                onCheckedChange={(v) => handleSettingChange('soundAlerts', v)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-white">Email Digest</p>
                <p className="text-white/40 text-sm">Daily summary via email</p>
              </div>
              <Switch
                checked={settings.emailDigest}
                onCheckedChange={(v) => handleSettingChange('emailDigest', v)}
              />
            </div>
          </div>
        </Card>

        {/* Appearance Settings */}
        <Card className="command-widget p-6 border-0">
          <div className="flex items-center gap-2 mb-6">
            <Moon className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-white">Appearance</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white">Dark Mode</p>
                <p className="text-white/40 text-sm">Use dark theme</p>
              </div>
              <Switch
                checked={settings.darkMode}
                onCheckedChange={(v) => handleSettingChange('darkMode', v)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-white">Language</p>
                <p className="text-white/40 text-sm">Select your language</p>
              </div>
              <select
                value={settings.language}
                onChange={(e) => handleSettingChange('language', e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Security Settings */}
        <Card className="command-widget p-6 border-0">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-5 h-5 text-green-400" />
            <h2 className="text-lg font-semibold text-white">Security</h2>
          </div>

          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full border-white/20 text-white hover:bg-white/10 justify-start"
            >
              Change Password
            </Button>
            <Button
              variant="outline"
              className="w-full border-white/20 text-white hover:bg-white/10 justify-start"
            >
              Enable Two-Factor Auth
            </Button>
            <Button
              variant="outline"
              className="w-full border-white/20 text-white hover:bg-white/10 justify-start"
            >
              View Login History
            </Button>
          </div>
        </Card>

        {/* Feedback */}
        <Card className="command-widget p-6 border-0">
          <div className="flex items-center gap-2 mb-6">
            <MessageSquare className="w-5 h-5 text-pink-400" />
            <h2 className="text-lg font-semibold text-white">Send Feedback</h2>
          </div>

          {feedback.submitted ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 mx-auto text-green-400 mb-4" />
              <p className="text-white">Thank you for your feedback!</p>
              <p className="text-white/40 text-sm mt-1">We appreciate your input.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <select
                value={feedback.category}
                onChange={(e) =>
                  setFeedback((prev) => ({ ...prev, category: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
              >
                <option value="general">General Feedback</option>
                <option value="bug">Bug Report</option>
                <option value="feature">Feature Request</option>
                <option value="improvement">Improvement Suggestion</option>
              </select>

              <Textarea
                placeholder="Share your thoughts..."
                value={feedback.message}
                onChange={(e) =>
                  setFeedback((prev) => ({ ...prev, message: e.target.value }))
                }
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40 min-h-[120px]"
              />

              <Button
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0"
                onClick={handleSubmitFeedback}
                disabled={!feedback.message.trim() || feedback.submitting}
              >
                {feedback.submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Feedback
                  </>
                )}
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
