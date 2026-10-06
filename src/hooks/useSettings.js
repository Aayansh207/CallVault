import { useApp } from '../context/AppContext';

export function useSettings() {
  const { settings, updateSetting, fetchSettings } = useApp();
  return {
    settings,
    updateSetting,
    fetchSettings,
  };
}

export default useSettings;
