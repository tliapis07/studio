
'use client';

import React, { useEffect, useState } from 'react';
import Joyride, { Step, CallBackProps, STATUS } from 'react-joyride';
import { useUser } from '@/firebase';

const OnboardingTour = () => {
  const { user } = useUser();
  const [run, setRun] = useState(false);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('hasSeenTour');
    if (!hasSeenTour && user) {
      const timer = setTimeout(() => {
        setRun(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const steps: Step[] = [
    {
      target: 'body',
      placement: 'center',
      content: (
        <div className="text-left space-y-2">
          <h3 className="font-black text-primary text-lg">Welcome to SalesStream!</h3>
          <p className="text-sm font-medium">Ready for a quick 1-minute tour of your new Partner Portal? We'll show you how to manage your team and track performance.</p>
        </div>
      ),
      disableBeacon: true,
    },
    {
      target: '[data-sidebar="sidebar"]',
      content: 'Access all team resources here: Pipeline, Leads, Analytics, and Training Materials.',
      placement: 'right',
    },
    {
      target: '.stat-cards-grid',
      content: 'Monitor high-level team KPIs. Click any card to jump into detailed analytics.',
      placement: 'bottom',
    },
    {
      target: '.velocity-chart-card',
      content: 'Track lead inbound velocity. This helps you understand when your reps are busiest.',
      placement: 'top',
    },
    {
      target: '.ai-insights-card',
      content: 'Gemini analyzes your team data to provide actionable management insights.',
      placement: 'left',
    },
    {
      target: '.quota-attainment-card',
      content: 'Monitor individual rep progress toward their monthly sales targets.',
      placement: 'left',
    },
    {
      target: '.sales-toolkit-card',
      content: 'Equip your team with scripts, templates, and objection handlers.',
      placement: 'top',
    },
    {
      target: '[data-sidebar="trigger"]',
      content: 'You can collapse the sidebar anytime to focus on your data.',
      placement: 'right',
    },
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
      setRun(false);
      localStorage.setItem('hasSeenTour', 'true');
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          arrowColor: 'hsl(var(--card))',
          backgroundColor: 'hsl(var(--card))',
          overlayColor: 'rgba(0, 0, 0, 0.75)',
          primaryColor: 'hsl(var(--primary))',
          textColor: 'hsl(var(--foreground))',
          zIndex: 1000,
        },
        tooltipContainer: {
          textAlign: 'left',
          borderRadius: '1.5rem',
          padding: '1rem',
          border: '2px solid hsl(var(--border))',
        },
        buttonNext: {
          borderRadius: '0.75rem',
          fontWeight: '900',
          textTransform: 'uppercase',
          fontSize: '11px',
          letterSpacing: '0.1em',
        },
        buttonBack: {
          marginRight: 10,
          fontWeight: '900',
          textTransform: 'uppercase',
          fontSize: '11px',
          letterSpacing: '0.1em',
        },
        buttonSkip: {
          fontWeight: '900',
          textTransform: 'uppercase',
          fontSize: '11px',
          letterSpacing: '0.1em',
        }
      }}
    />
  );
};

export default OnboardingTour;
