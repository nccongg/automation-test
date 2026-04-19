/**
 * Settings Page
 * 
 * User settings and preferences
 * Uses feature components from /features/settings
 */

import { useState } from 'react';
import { useSettings } from '@/features/settings/hooks/useSettings';
import LoadingSpinner from '@/shared/components/common/LoadingSpinner';
import ErrorPopup from '@/shared/components/common/ErrorPopup';
import PageHeader from '@/shared/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function SettingsPage() {
  const { settings, loading, error, updateSettings } = useSettings();
  const [formData, setFormData] = useState({
    email: '',
    timezone: 'UTC',
    weeklySummary: true,
  });

  // Update form data when settings load
  useState(() => {
    if (settings) {
      setFormData({
        email: settings.email || '',
        timezone: settings.timezone || 'UTC',
        weeklySummary: settings.notifications?.weeklySummary ?? true,
      });
    }
  });

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" label="Loading settings..." />
      </div>
    );
  }

  if (error) {
    return <ErrorPopup open={true} onClose={() => window.location.reload()} onRetry={() => window.location.reload()} />;
  }

  const handleSave = async () => {
    const result = await updateSettings({
      email: formData.email,
      timezone: formData.timezone,
      notifications: {
        weeklySummary: formData.weeklySummary,
      },
    });

    if (result.success) {
      console.log('Settings saved');
    } else {
      console.error('Failed to save settings');
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Settings"
        description="Configure your workspace preferences"
        action={
          <Button
            onClick={handleSave}
            className="bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)]"
          >
            Save changes
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-6 px-6">
          <div>
            <div className="text-base font-semibold">Notifications</div>
            <div className="mt-1 text-sm text-muted-foreground">
              Choose what updates you want to receive.
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notification-email">Email</Label>
              <Input
                id="notification-email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                type="email"
              />
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-border p-4">
              <Checkbox
                checked={formData.weeklySummary}
                onCheckedChange={(v) => setFormData(prev => ({ ...prev, weeklySummary: Boolean(v) }))}
                id="weekly-summary"
              />
              <div className="space-y-0.5">
                <Label htmlFor="weekly-summary" className="cursor-pointer">
                  Weekly summary emails
                </Label>
                <div className="text-xs text-muted-foreground">
                  Get a digest of pass rate and failures every week.
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="space-y-6 px-6">
          <div>
            <div className="text-base font-semibold">Workspace</div>
            <div className="mt-1 text-sm text-muted-foreground">
              Control project behavior and reporting defaults.
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select value={formData.timezone} onValueChange={(value) => setFormData(prev => ({ ...prev, timezone: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">America/New_York</SelectItem>
                  <SelectItem value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Default project visibility</Label>
              <Select value="private" onValueChange={() => {}}>
                <SelectTrigger>
                  <SelectValue placeholder="Private" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="team">Team</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-xs text-muted-foreground">
                This controls how new projects appear by default.
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
