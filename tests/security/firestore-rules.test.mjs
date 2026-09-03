import fs from 'node:fs/promises';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const projectId = 'munazzim-security-rules-test';
const testEnvironment = await initializeTestEnvironment({
  projectId,
  firestore: {
    host: '127.0.0.1',
    port: 18081,
    rules: await fs.readFile(new URL('../../firestore.rules', import.meta.url), 'utf8'),
  },
});

async function seed(collection, id, userId) {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), collection, id), { userId, title: id });
  });
}

try {
  await seed('tasks', 'user-b-task', 'user-b');
  await seed('appointments', 'user-b-appointment', 'user-b');
  await seed('ai_logs', 'user-b-log', 'user-b');

  const anonymous = testEnvironment.unauthenticatedContext().firestore();
  const userA = testEnvironment.authenticatedContext('user-a').firestore();
  const userB = testEnvironment.authenticatedContext('user-b').firestore();

  await assertFails(getDoc(doc(anonymous, 'tasks', 'user-b-task')));
  await assertFails(setDoc(doc(anonymous, 'tasks', 'anonymous-task'), { userId: 'anonymous-task' }));
  await assertSucceeds(setDoc(doc(userA, 'tasks', 'user-a-task'), { userId: 'user-a', title: 'Owned task' }));
  await assertSucceeds(getDoc(doc(userA, 'tasks', 'user-a-task')));
  await assertFails(getDoc(doc(userA, 'tasks', 'user-b-task')));
  await assertFails(setDoc(doc(userA, 'tasks', 'user-b-write'), { userId: 'user-b', title: 'Denied' }));

  await assertSucceeds(setDoc(doc(userB, 'appointments', 'user-b-owned'), { userId: 'user-b', title: 'Owned appointment' }));
  await assertFails(getDoc(doc(userA, 'appointments', 'user-b-appointment')));
  await assertFails(setDoc(doc(userA, 'appointments', 'user-b-write'), { userId: 'user-b', title: 'Denied' }));

  await assertSucceeds(setDoc(doc(userB, 'ai_logs', 'user-b-owned'), { userId: 'user-b', title: 'Owned log' }));
  await assertFails(getDoc(doc(userA, 'ai_logs', 'user-b-log')));
  await assertFails(setDoc(doc(userA, 'ai_logs', 'user-b-write'), { userId: 'user-b', title: 'Denied' }));

  console.log('Firestore Rules verification: PASS');
} finally {
  await testEnvironment.cleanup();
}