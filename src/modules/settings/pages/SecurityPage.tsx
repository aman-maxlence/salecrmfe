import { useState } from 'react';
import { toast } from 'react-toastify';
import { ShieldCheck, Lock, KeyRound, Save } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export default function SecurityPage() {
  const [currPassword, setCurrPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleUpdate = () => {
    if (!currPassword || !newPassword) {
      toast.error('Please enter current and new password');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    toast.success('Password changed successfully');
    setCurrPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="max-w-3xl space-y-6 pb-12">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-blue-600" />
          Password & Security
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account password, two-factor authentication, and security preferences.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
        <h3 className="text-sm font-semibold text-foreground">Change Password</h3>

        <div className="space-y-4 max-w-md">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Current Password</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={currPassword}
              onChange={(e) => setCurrPassword(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">New Password</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Confirm New Password</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-border">
          <Button onClick={handleUpdate} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Lock className="h-4 w-4 mr-2" />
            Update Password
          </Button>
        </div>
      </div>
    </div>
  );
}
