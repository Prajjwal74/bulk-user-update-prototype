import { AppStateProvider, useAppState } from './context/AppState';
import { Stepper } from './components/Stepper';
import { Step1UserSelection } from './steps/Step1UserSelection';
import { Step2FieldSelection } from './steps/Step2FieldSelection';
import { Step4Preview } from './steps/Step4Preview';
import { Step6Approval } from './steps/Step6Approval';
import { Step7EditHistory } from './steps/Step7EditHistory';
import './App.css';

function AppContent() {
  const { currentStep } = useAppState();

  if (currentStep === 0) {
    return (
      <div className="app-layout app-layout--full">
        <main className="app-main" role="main">
          <Step7EditHistory />
        </main>
      </div>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1UserSelection />;
      case 2:
        return <Step2FieldSelection />;
      case 3:
        return <Step4Preview />;
      case 4:
        return <Step6Approval />;
      default:
        return <Step1UserSelection />;
    }
  };

  return (
    <div className="app-layout">
      <Stepper />
      <main className="app-main" role="main">
        {renderStep()}
      </main>
    </div>
  );
}

function App() {
  return (
    <AppStateProvider>
      <AppContent />
    </AppStateProvider>
  );
}

export default App;
