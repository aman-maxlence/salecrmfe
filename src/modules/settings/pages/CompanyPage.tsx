import { useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { Building2, MapPin, Globe, FileText, Save } from 'lucide-react';
import { RootState } from '@/store/store';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export default function CompanyPage() {
  const org = useSelector((state: RootState) => state.auth.organization);

  const [companyName, setCompanyName] = useState(org?.name ?? 'Company HQ');
  const [taxId, setTaxId] = useState('GSTIN29ABCDE1234F1Z5');
  const [address, setAddress] = useState('Tower B, DLF Cyber City, Sector 24');
  const [city, setCity] = useState('Gurgaon');
  const [state, setState] = useState('Haryana');
  const [website, setWebsite] = useState('https://companyhq.example.com');

  const handleSave = () => {
    toast.success('Company details saved successfully');
  };

  return (
    <div className="max-w-3xl space-y-6 pb-12">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Building2 className="h-5 w-5 text-blue-600" />
          Company Details
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your organization profile, legal business entity information, and registered headquarters.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Organization / Legal Name</label>
            <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Tax / GST Number</label>
            <Input value={taxId} onChange={(e) => setTaxId(e.target.value)} />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-medium text-foreground">Headquarters Street Address</label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">City</label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">State / Province</label>
            <Input value={state} onChange={(e) => setState(e.target.value)} />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-medium text-foreground">Official Website</label>
            <Input value={website} onChange={(e) => setWebsite(e.target.value)} />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-border">
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Save className="h-4 w-4 mr-2" />
            Save Details
          </Button>
        </div>
      </div>
    </div>
  );
}
