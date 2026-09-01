import { ArrowRight } from 'lucide-react';
import { Button } from '@/modules/settings/components/ui/Button';
import { StepComponentProps } from './types';
import { MaxSalesMark } from '../MaxSalesMark';

/**
 * Design doc §4.2 Screen 1. Copy should say "You've been invited to {org} by
 * {inviter}" for non-first users, but there's no "who invited me" data
 * available client-side (the onboarding state/PortalUser/org models expose
 * none), so this always shows the generic welcome copy rather than
 * fabricating an inviter name.
 */
export function WelcomeStep({ goNext }: StepComponentProps) {
  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden px-6 py-[100px]">
      <img
        src="/network-face.svg"
        alt=""
        className="pointer-events-none absolute left-0 top-[100px] w-[380px] max-w-[45vw]"
      />
      <div className="relative z-10 flex flex-col items-center text-center">
        <MaxSalesMark className="h-20 w-auto" />
        <div className="mt-6 flex flex-col gap-2">
          <h1
            className="flex h-20 flex-col justify-center self-stretch text-center"
            style={{
              color: '#111',
              WebkitTextStrokeWidth: '3px',
              WebkitTextStrokeColor: '#FFF',
              fontFamily: 'Poppins, sans-serif',
              fontSize: '64px',
              fontWeight: 600,
              lineHeight: '32px',
            }}
          >
            Welcome to MaxSales
          </h1>
          <p className="text-muted-foreground">Drive Revenue. Maximize Sales. Simplify CRM</p>
        </div>
        <Button type="button" size="md" className="mt-[173px] gap-2 px-8" onClick={goNext}>
          Let's Get Started
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
