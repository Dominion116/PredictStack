import { MongoClient } from 'mongodb';

const DEFAULT_STORE = {
  meta: { createdAt: null, updatedAt: null },
  markets: {},
  marketRefsByContractId: {},
  users: {},
  positions: {},
  bets: {},
  claims: {},
};

const DOC_ID = 'main';


export class MongoStore {
  constructor(uri) {
    if (!uri) throw new Error('MONGODB_URI is required');
    this.uri = uri;
    this.state = structuredClone(DEFAULT_STORE);
    this.client = null;
    this.col = null;
  }

  async init() {
    this.client = new MongoClient(this.uri, { serverSelectionTimeoutMS: 10_000 });
    await this.client.connect();
    this.col = this.client.db('predictstack').collection('store');

    const doc = await this.col.findOne({ _id: DOC_ID });
    if (doc) {
      const { _id, ...rest } = doc;
      this.state = { ...structuredClone(DEFAULT_STORE), ...rest };
    } else {
      const now = new Date().toISOString();
      this.state.meta.createdAt = now;
      this.state.meta.updatedAt = now;
      await this.save();
    }
    return this;
  }

  async save() {
    this.state.meta.updatedAt = new Date().toISOString();
    await this.col.replaceOne(
      { _id: DOC_ID },
      { _id: DOC_ID, ...this.state },
      { upsert: true },
    );
  }

  getState() {
    return this.state;
  }

  async close() {
    await this.client?.close();
  }
}
