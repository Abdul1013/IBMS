import type { GlobalSetupContext } from 'vitest/node';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongo: MongoMemoryServer | undefined;

export async function setup({ provide }: GlobalSetupContext): Promise<void> {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  process.env['MONGO_URI'] = uri;
  provide('MONGO_URI', uri);
}

export async function teardown(): Promise<void> {
  await mongo?.stop();
}

declare module 'vitest' {
  export interface ProvidedContext {
    MONGO_URI: string;
  }
}
