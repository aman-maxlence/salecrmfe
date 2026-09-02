import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { Building2, Landmark, Save } from 'lucide-react';
import { RootState } from '@/store/store';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useGetCompanyDetailsQuery, useUpdateCompanyDetailsMutation } from '../services/companyDetailsApi';
import { getErrorMessage, UpdateCompanyDetailsBody } from '../models';

type FormState = Required<{ [K in keyof UpdateCompanyDetailsBody]: string }>;

const DEFAULT_STATE: FormState = {
  phone: '',
  email: '',
  website: '',
  companyName: '',
  vatId: '',
  address: '',
  city: '',
  state: '',
  bankName: '',
  bankAddress: '',
  bankRoutingNumber: '',
  bankAccountHolderName: '',
  bankAccountNumber: '',
  iban: '',
  swiftCode: '',
  bic: '',
};

const BANK_FIELDS: { key: keyof FormState; label: string; span?: boolean }[] = [
  { key: 'bankName', label: 'Bank Name' },
  { key: 'bankAddress', label: 'Bank Address', span: true },
  { key: 'bankRoutingNumber', label: 'Bank Routing Number' },
  { key: 'bankAccountHolderName', label: 'Bank Account Holder Name' },
  { key: 'bankAccountNumber', label: 'Bank Account Number' },
  { key: 'iban', label: 'IBAN' },
  { key: 'swiftCode', label: 'SWIFT Code' },
  { key: 'bic', label: 'BIC' },
];

export default function CompanyPage() {
  const org = useSelector((state: RootState) => state.auth.organization);
  const orgId = org?.id;

  const { data: details, isLoading } = useGetCompanyDetailsQuery(orgId ?? 0, { skip: !orgId });
  const [updateCompanyDetails, { isLoading: isSaving }] = useUpdateCompanyDetailsMutation();

  const [state, setState] = useState<FormState>(DEFAULT_STATE);

  useEffect(() => {
    if (!details) return;
    setState({
      phone: details.phone ?? '',
      email: details.email ?? '',
      website: details.website ?? '',
      companyName: details.companyName ?? org?.name ?? '',
      vatId: details.vatId ?? '',
      address: details.address ?? '',
      city: details.city ?? '',
      state: details.state ?? '',
      bankName: details.bankName ?? '',
      bankAddress: details.bankAddress ?? '',
      bankRoutingNumber: details.bankRoutingNumber ?? '',
      bankAccountHolderName: details.bankAccountHolderName ?? '',
      bankAccountNumber: details.bankAccountNumber ?? '',
      iban: details.iban ?? '',
      swiftCode: details.swiftCode ?? '',
      bic: details.bic ?? '',
    });
  }, [details, org?.name]);

  const setField = (key: keyof FormState) => (value: string) =>
    setState((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!orgId) return;
    try {
      const body = Object.fromEntries(
        Object.entries(state).map(([key, value]) => [key, value.trim() || null])
      ) as UpdateCompanyDetailsBody;

      await updateCompanyDetails({ orgId, body }).unwrap();
      toast.success('Company details saved successfully');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save company details'));
    }
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading company details...</p>;
  }

  return (
    <div className="w-full space-y-6 pb-12">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Company Details
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Contact info, tax ID, and bank details used on invoices and billing documents.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
        <h2 className="text-sm font-semibold text-foreground">Contact Information</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Phone</label>
            <Input value={state.phone} onChange={(e) => setField('phone')(e.target.value)} placeholder="+91 98765 43210" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Email</label>
            <Input
              type="email"
              value={state.email}
              onChange={(e) => setField('email')(e.target.value)}
              placeholder="contact@company.com"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-medium text-foreground">Website</label>
            <Input value={state.website} onChange={(e) => setField('website')(e.target.value)} placeholder="https://company.com" />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
        <h2 className="text-sm font-semibold text-foreground">Company Details</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Organization / Legal Name</label>
            <Input value={state.companyName} onChange={(e) => setField('companyName')(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">VAT / Tax ID</label>
            <Input value={state.vatId} onChange={(e) => setField('vatId')(e.target.value)} />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-medium text-foreground">Address</label>
            <Input value={state.address} onChange={(e) => setField('address')(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">City</label>
            <Input value={state.city} onChange={(e) => setField('city')(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">State / Province</label>
            <Input value={state.state} onChange={(e) => setField('state')(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <Landmark className="h-4 w-4 text-muted-foreground" />
          Bank Details
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {BANK_FIELDS.map(({ key, label, span }) => (
            <div key={key} className={`space-y-1.5 ${span ? 'sm:col-span-2' : ''}`}>
              <label className="text-xs font-medium text-foreground">{label}</label>
              <Input value={state[key]} onChange={(e) => setField(key)(e.target.value)} />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save Details'}
        </Button>
      </div>
    </div>
  );
}
