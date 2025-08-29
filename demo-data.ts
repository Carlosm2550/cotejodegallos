import { Cuerda, Gallo } from './types';

/**
 * Returns empty arrays for cuerdas and gallos, effectively removing the demo data.
 */
export const processDemoData = (): { cuerdas: Cuerda[], gallos: Gallo[] } => {
    return { cuerdas: [], gallos: [] };
};
