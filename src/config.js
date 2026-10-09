// קריאת site.config.json ונגזרות שלו.
import config from '../site.config.json' with { type: 'json' };
import { isTrue } from './util.js';

export { config };

export const ALL_FIELDS = [...config.fields, ...config.settingsFields];
export const FIELD_BY_KEY = new Map(ALL_FIELDS.map((f) => [f.key, f]));

export const DEFAULTS = Object.fromEntries(
  ALL_FIELDS.filter((f) => f.default !== undefined).map((f) => [f.key, f.default]),
);

export function isDemo(env) {
  return isTrue(env.DEMO_MODE);
}

export function limits(env) {
  return isDemo(env) ? { ...config.limits, ...config.demoLimits } : { ...config.limits };
}
