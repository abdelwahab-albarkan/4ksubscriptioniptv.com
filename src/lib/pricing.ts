// Single source for "from $X / mo" style prices shown in text.
// The numbers come from src/data/site-config.json -> pricing[], so changing a plan price there updates every page.
import siteConfig from '../data/site-config.json';

const plans: any[] = (siteConfig as any).pricing || [];
const min = (k: string) => Math.min(...plans.map((p) => Number(p[k])));

export const fromUsd = `$${min('priceUsd').toFixed(2)}`;
export const fromGbp = `£${min('priceGbp').toFixed(2)}`;
export const fromEur = `€${min('priceEur').toFixed(2)}`;
export const fromUsdMo = `${fromUsd} / mo`;
export const fromGbpMo = `${fromGbp} / mo`;
