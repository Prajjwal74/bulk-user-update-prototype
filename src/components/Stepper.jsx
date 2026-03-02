import { useAppState } from '../context/AppState';
import './Stepper.css';

export function Stepper() {
  const { STEP_LABELS, currentStep, goToStep, submitted } = useAppState();

  const getStepState = (stepIndex) => {
    const step = stepIndex + 1;
    if (step < currentStep) return 'completed';
    if (step === currentStep) return 'current';
    return 'upcoming';
  };

  const isClickable = (stepIndex) => {
    const step = stepIndex + 1;
    if (submitted && step >= 1 && step <= 5) return false;
    if (step === 7) return true;
    return step <= currentStep;
  };

  return (
    <nav className="stepper" aria-label="Bulk update steps">
      <div className="stepper-heading">Bulk Change</div>
      <ul className="stepper-list">
        {STEP_LABELS.map((label, index) => {
          const step = index + 1;
          const state = getStepState(index);
          const clickable = isClickable(index);
          return (
            <li
              key={step}
              className={`stepper-item stepper-item--${state} ${clickable ? 'stepper-item--clickable' : ''}`}
              onClick={() => clickable && goToStep(step)}
            >
              <span className="stepper-indicator">
                {state === 'completed' ? (
                  <span className="stepper-check" aria-hidden>✓</span>
                ) : (
                  <span className="stepper-number">{step}</span>
                )}
              </span>
              <span className="stepper-label">{label}</span>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
