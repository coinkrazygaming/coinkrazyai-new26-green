import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, ChevronRight, CheckCircle2, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KYCStep {
  step: number;
  title: string;
  description: string;
  aiMessage: string;
  fields: string[];
}

const KYC_STEPS: KYCStep[] = [
  {
    step: 1,
    title: 'Identity Verification',
    description: 'Verify your identity with a government-issued ID',
    aiMessage: "Hi! I'm LuckyAI. Let's start by verifying your identity. Please upload a clear photo of your government-issued ID (passport, driver's license, or national ID).",
    fields: ['idType', 'idNumber', 'expiryDate']
  },
  {
    step: 2,
    title: 'Address Verification',
    description: 'Confirm your residential address',
    aiMessage: "Great! Now let's verify your address. Please upload a recent utility bill, bank statement, or lease agreement showing your current address.",
    fields: ['address', 'city', 'state', 'zipCode']
  },
  {
    step: 3,
    title: 'Payment Verification',
    description: 'Add and verify your payment method',
    aiMessage: "Perfect! Now let's set up your payment method. You can add PayPal, Cash App, or a bank account for future withdrawals.",
    fields: ['paymentMethod', 'accountDetails']
  },
  {
    step: 4,
    title: 'Email & Phone Verification',
    description: 'Verify your email and phone number',
    aiMessage: 'Almost done! Let\'s verify your email and phone number. We\'ll send you verification codes to confirm these details.',
    fields: ['email', 'phone']
  },
  {
    step: 5,
    title: 'Review & Confirm',
    description: 'Review your information and complete KYC',
    aiMessage: 'Excellent! Let\'s review everything. Once you confirm, your account will be fully verified and you\'ll unlock all premium features!',
    fields: []
  }
];

interface KYCOnboardingPopupProps {
  currentStep?: number;
  onComplete: () => Promise<void>;
  onSkip: () => void;
}

export const KYCOnboardingPopup: React.FC<KYCOnboardingPopupProps> = ({
  currentStep = 1,
  onComplete,
  onSkip,
}) => {
  const [step, setStep] = useState(currentStep);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const currentStepData = KYC_STEPS[step - 1];
  const progress = (step / KYC_STEPS.length) * 100;

  const handleStepComplete = () => {
    setCompletedSteps([...completedSteps, step]);
    if (step < KYC_STEPS.length) {
      setStep(step + 1);
    }
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      await onComplete();
    } catch (error) {
      console.error('Completion failed:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border-2 border-primary rounded-lg p-8 max-w-2xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            <div>
              <h2 className="text-2xl font-bold text-foreground">Account Verification</h2>
              <p className="text-sm text-muted-foreground">With LuckyAI</p>
            </div>
          </div>
          <button
            onClick={onSkip}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-foreground">
              Step {step} of {KYC_STEPS.length}
            </span>
            <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step Indicators */}
        <div className="grid grid-cols-5 gap-2 mb-8">
          {KYC_STEPS.map((s) => (
            <div
              key={s.step}
              className={cn(
                'flex flex-col items-center gap-2 p-2 rounded-lg transition-all',
                completedSteps.includes(s.step)
                  ? 'bg-primary/20 border border-primary'
                  : s.step === step
                    ? 'bg-primary/10 border border-primary/50'
                    : 'bg-muted border border-border'
              )}
            >
              {completedSteps.includes(s.step) ? (
                <CheckCircle2 className="w-5 h-5 text-primary" />
              ) : (
                <div className={cn(
                  'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold',
                  s.step === step ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground/30'
                )}>
                  {s.step}
                </div>
              )}
              <span className="text-xs font-semibold text-center truncate">{s.title.split(' ')[0]}</span>
            </div>
          ))}
        </div>

        {/* AI Assistant Message */}
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border-l-4 border-primary rounded-lg p-4 mb-8">
          <div className="flex gap-3">
            <div className="text-3xl">🤖</div>
            <div>
              <p className="font-semibold text-sm text-foreground mb-1">LuckyAI</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {currentStepData.aiMessage}
              </p>
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-muted/30 rounded-lg p-6 mb-8 border border-border">
          <h3 className="text-lg font-bold text-foreground mb-2">{currentStepData.title}</h3>
          <p className="text-sm text-muted-foreground mb-4">{currentStepData.description}</p>

          {step === 5 ? (
            // Review step
            <div className="space-y-3">
              {KYC_STEPS.slice(0, 4).map((s) => (
                <div
                  key={s.step}
                  className="flex items-center justify-between p-3 bg-background rounded-lg border border-border"
                >
                  <span className="text-sm font-medium">{s.title}</span>
                  {completedSteps.includes(s.step) ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-yellow-500" />
                  )}
                </div>
              ))}
            </div>
          ) : (
            // Input form placeholder
            <div className="space-y-4">
              {currentStepData.fields.map((field) => (
                <div key={field}>
                  <label className="text-sm font-medium text-foreground mb-2 block capitalize">
                    {field.replace(/([A-Z])/g, ' $1')}
                  </label>
                  <input
                    type="text"
                    placeholder={`Enter your ${field}`}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Benefits Box */}
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-8">
          <p className="text-sm font-semibold text-green-700 dark:text-green-400 mb-2">
            Benefits of KYC Verification:
          </p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>✓ Unlock higher withdrawal limits</li>
            <li>✓ Access premium games and features</li>
            <li>✓ Secure your account</li>
            <li>✓ Enable instant redemptions</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onSkip}
          >
            Maybe Later
          </Button>
          {step < KYC_STEPS.length ? (
            <Button
              className="flex-1 bg-primary hover:bg-primary/90 flex items-center justify-center gap-2"
              onClick={handleStepComplete}
            >
              Next Step
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700 font-bold"
              onClick={handleComplete}
              disabled={isCompleting}
            >
              {isCompleting ? 'Verifying...' : 'Complete Verification'}
            </Button>
          )}
        </div>

        {/* Info */}
        <p className="text-xs text-muted-foreground text-center mt-4">
          Your information is encrypted and protected. It only takes a few minutes to verify your account.
        </p>
      </div>
    </div>
  );
};
