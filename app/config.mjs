import path from 'node:path';
import {fileURLToPath} from 'node:url';
// Resolve from the installation, independent of the terminal's working folder.
export const dataRoot = path.resolve(process.env.JOBTRACKER_DATA_DIR || fileURLToPath(new URL('../data/', import.meta.url)));