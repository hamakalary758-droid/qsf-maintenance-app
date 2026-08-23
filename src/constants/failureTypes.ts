export const FAILURE_TYPES = [
  'Mechanical Failure',
  'Electrical Fault',
  'Hydraulic Leak / Pressure',
  'Pneumatic Issue',
  'Instrumentation / Sensor',
  'Wear & Tear',
  'Operational Error',
  'Thermal / Overheating',
  'Corrosion / Chemical'
] as const;

export const FAILURE_TYPE_LABELS: Record<string, { en: string; ar: string; ckb: string }> = {
  'Mechanical Failure': { en: 'Mechanical Failure', ar: 'عطل ميكانيكي', ckb: 'گرفتی میکانیکی' },
  'Electrical Fault': { en: 'Electrical Fault', ar: 'عطل كهربائي', ckb: 'گرفتی کارەبایی' },
  'Hydraulic Leak / Pressure': { en: 'Hydraulic Leak / Pressure', ar: 'تسرب هيدروليكي / ضغط', ckb: 'ڕشانەوەی هایدرۆلیکی / پەستان' },
  'Pneumatic Issue': { en: 'Pneumatic Issue', ar: 'مشكلة هوائية', ckb: 'گرفتی هەوایی' },
  'Instrumentation / Sensor': { en: 'Instrumentation / Sensor', ar: 'أجهزة القياس / مستشعر', ckb: 'ئامێری پێوانە / هەستەکەر' },
  'Wear & Tear': { en: 'Wear & Tear', ar: 'تآكل واهتراء', ckb: 'توانەوە و کۆنبوونەوە' },
  'Operational Error': { en: 'Operational Error', ar: 'خطأ تشغيلي', ckb: 'هەڵەی کارکردن' },
  'Thermal / Overheating': { en: 'Thermal / Overheating', ar: 'حراري / سخونة زائدة', ckb: 'گەرمایی / گەرمی زیادە' },
  'Corrosion / Chemical': { en: 'Corrosion / Chemical', ar: 'تآكل كيميائي', ckb: 'ژەنگ / کیمیایی' },
};

