import { useApp } from '../context/AppContext';

export function useScanner() {
  const { scanningState, startScan, cancelScan } = useApp();
  return {
    scanningState,
    startScan,
    cancelScan,
    isScanning: scanningState.isScanning,
  };
}

export default useScanner;
