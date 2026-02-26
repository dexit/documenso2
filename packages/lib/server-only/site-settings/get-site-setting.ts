import { getSiteSettings } from './get-site-settings';

export const getSiteSetting = async <T extends { id: string }>(id: T['id']) => {
  const settings = await getSiteSettings();

  return (settings.find((s) => s.id === id) as T) ?? null;
};
