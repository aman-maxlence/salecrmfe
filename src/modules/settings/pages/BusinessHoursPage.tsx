import { useState } from 'react';
import { toast } from 'react-toastify';
import { Clock, CalendarCheck, Save } from 'lucide-react';
import { Button } from '../components/ui/Button';

const DAYS = [
  { key: 'mon', label: 'Monday', defaultOpen: true, start: '09:00', end: '18:00' },
  { key: 'tue', label: 'Tuesday', defaultOpen: true, start: '09:00', end: '18:00' },
  { key: 'wed', label: 'Wednesday', defaultOpen: true, start: '09:00', end: '18:00' },
  { key: 'thu', label: 'Thursday', defaultOpen: true, start: '09:00', end: '18:00' },
  { key: 'fri', label: 'Friday', defaultOpen: true, start: '09:00', end: '18:00' },
  { key: 'sat', label: 'Saturday', defaultOpen: false, start: '10:00', end: '14:00' },
  { key: 'sun', label: 'Sunday', defaultOpen: false, start: '10:00', end: '14:00' },
];

export default function BusinessHoursPage() {
  const [schedule, setSchedule] = useState(
    DAYS.map((d) => ({ ...d, isOpen: d.defaultOpen }))
  );

  const toggleDay = (index: number) => {
    setSchedule((prev) =>
      prev.map((item, i) => (i === index ? { ...item, isOpen: !item.isOpen } : item))
    );
  };

  const handleSave = () => {
    toast.success('Business hours schedule updated');
  };

  return (
    <div className="max-w-3xl space-y-6 pb-12">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-600" />
          Business Hours
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Define working shifts and operational business hours for sales lead response SLA timers.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="divide-y divide-border">
          {schedule.map((day, idx) => (
            <div key={day.key} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id={`day-${day.key}`}
                  checked={day.isOpen}
                  onChange={() => toggleDay(idx)}
                  className="h-4 w-4 rounded border-border text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor={`day-${day.key}`} className="text-sm font-medium text-foreground cursor-pointer w-28">
                  {day.label}
                </label>
              </div>

              {day.isOpen ? (
                <div className="flex items-center gap-2 text-xs">
                  <input
                    type="time"
                    defaultValue={day.start}
                    className="h-8 px-2 rounded border border-border bg-background text-foreground"
                  />
                  <span className="text-muted-foreground">to</span>
                  <input
                    type="time"
                    defaultValue={day.end}
                    className="h-8 px-2 rounded border border-border bg-background text-foreground"
                  />
                </div>
              ) : (
                <span className="text-xs font-medium text-muted-foreground">Closed</span>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-4 border-t border-border">
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Save className="h-4 w-4 mr-2" />
            Save Business Hours
          </Button>
        </div>
      </div>
    </div>
  );
}
