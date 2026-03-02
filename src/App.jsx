import { AppStateProvider, useAppState } from './context/AppState';
import { Stepper } from './components/Stepper';
import { Step1UserSelection } from './steps/Step1UserSelection';
import { Step2FieldSelection } from './steps/Step2FieldSelection';
import { Step3Validation } from './steps/Step3Validation';
import { Step4Preview } from './steps/Step4Preview';
import { Step5Confirm } from './steps/Step5Confirm';
import { Step6Approval } from './steps/Step6Approval';
import { Step7EditHistory } from './steps/Step7EditHistory';
import './App.css';

function AppContent() {
  const { currentStep } = useAppState();

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1UserSelection />;
      case 2:
        return <Step2FieldSelection />;
      case 3:
        return <Step3Validation />;
      case 4:
        return <Step4Preview />;
      case 5:
        return <Step5Confirm />;
      case 6:
        return <Step6Approval />;
      case 7:
        return <Step7EditHistory />;
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
