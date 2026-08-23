import en from './en';
import ar from './ar';
import ckb from './ckb';

export type Locale = 'en' | 'ar' | 'ckb';
export const dictionaries: Record<Locale, typeof en> = { en, ar, ckb };
export const RTL_LOCALES: Locale[] = ['ar', 'ckb'];
