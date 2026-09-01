import { useState } from 'react';
import { toast } from 'react-toastify';
import { Globe, Clock, Calendar, Save } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function RegionPage() {
  const [language, setLanguage] = useState('en-US');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  const [currency, setCurrency] = useState('INR');

  const handleSave = () => {
    toast.success('Localization settings saved');
  };

  return (
    <div className="max-w-3xl space-y-6 pb-12">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Globe className="h-5 w-5 text-blue-600" />
          Language, Region & Time
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure language, regional date formats, currency symbols, and primary timezone.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full h-9 px-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="en-US">English (United States)</option>
              <option value="en-GB">English (UK)</option>
              <option value="hi-IN">Hindi (India)</option>
              <option value="es-ES">Spanish</option>
              <option value="fr-FR">French</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Timezone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full h-9 px-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="Asia/Kolkata">Asia/Kolkata (IST +05:30)</option>
              <option value="America/New_York">America/New_York (EST -05:00)</option>
              <option value="America/Los_Angeles">America/Los_Angeles (PST -08:00)</option>
              <option value="Europe/London">Europe/London (GMT +00:00)</option>
              <option value="Asia/Dubai">Asia/Dubai (GST +04:00)</option>
              <option value="Asia/Singapore">Asia/Singapore (SGT +08:00)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Date Format</label>
            <select
              value={dateFormat}
              onChange={(e) => setDateFormat(e.target.value)}
              className="w-full h-9 px-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY (25/08/2026)</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY (08/25/2026)</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD (2026-08-25)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Default Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full h-9 px-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="INR">₹ INR (Indian Rupee)</option>
              <option value="USD">$ USD (US Dollar)</option>
              <option value="EUR">€ EUR (Euro)</option>
              <option value="GBP">£ GBP (British Pound)</option>
              <option value="AED">AED (UAE Dirham)</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-border">
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Save className="h-4 w-4 mr-2" />
            Save Preferences
          </Button>
        </div>
      </div>
    </div>
  );
}
