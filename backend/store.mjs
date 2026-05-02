import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_STORE = {
  meta: {
    createdAt: null,
    updatedAt: null,
  },
  markets: {},
  marketRefsByContractId: {},
  users: {},
  positions: {},
  bets: {},
  claims: {},
};

export class JsonStore {
  constructor(filePath) {
    this.filePath = filePath;
    this.state = structuredClone(DEFAULT_STORE);
  }

  async init() {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    try {
      const raw = await readFile(this.filePath, 'utf8');
      this.state = {
        ...structuredClone(DEFAULT_STORE),
        ...JSON.parse(raw),
      };
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
      const now = new Date().toISOString();
      this.state.meta.createdAt = now;
      this.state.meta.updatedAt = now;
      await this.save();
    }
    return this;
  }

  async save() {
    this.state.meta.updatedAt = new Date().toISOString();
    const tempPath = `${this.filePath}.tmp`;
    await writeFile(tempPath, JSON.stringify(this.state, null, 2));
    await rename(tempPath, this.filePath);
  }

  getState() {
    return this.state;
  }
}
