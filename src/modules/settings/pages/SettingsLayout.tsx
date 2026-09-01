import { Outlet } from 'react-router-dom';

export default function SettingsLayout() {
  return (
    <div className="w-full">
      <Outlet />
    </div>
  );
}
