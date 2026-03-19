
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
        <div className="text-left space-y-3 p-2">
          <h3 className="font-black text-primary text-xl">Welcome to SalesStream!</h3>
          <p className="text-sm font-medium leading-relaxed">Ready for a comprehensive tour of your new high-performance Partner Portal? We'll show you how to manage your organization efficiently.</p>
        </div>
      ),
      disableBeacon: true,
    },
    {
      target: '[data-sidebar="sidebar"]',
      content: 'Access all team resources here: Pipeline, Leads, Analytics, and the new Training Hub.',
      placement: 'right',
      disableScrolling: false,
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
      target: '.sales-toolkit-card',
      content: 'Equip your team with scripts, templates, and objection handlers.',
      placement: 'top',
    },
    {
      target: '.fixed.bottom-6.right-6',
      content: 'Need help? Your Partner AI assistant is always available for quick tasks and insights.',
      placement: 'left',
    }
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
      scrollToFirstStep
      scrollDuration={400}
      scrollOffset={100}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          arrowColor: 'hsl(var(--card))',
          backgroundColor: 'hsl(var(--card))',
          overlayColor: 'rgba(0, 0, 0, 0.85)',
          primaryColor: 'hsl(var(--primary))',
          textColor: 'hsl(var(--foreground))',
          zIndex: 1000,
        },
        tooltipContainer: {
          textAlign: 'left',
          borderRadius: '1.5rem',
          padding: '1.5rem',
          border: '2px solid hsl(var(--border))',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        },
        buttonNext: {
          borderRadius: '0.75rem',
          fontWeight: '900',
          padding: '0.75rem 1.5rem',
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
