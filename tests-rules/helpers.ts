import { readFileSync } from 'fs';
import { initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';

export async function env(): Promise<RulesTestEnvironment> {
  return initializeTestEnvironment({ projectId: 'demo-aeonfall', firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 } });
}
