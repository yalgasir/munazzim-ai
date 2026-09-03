const { initializeApp, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const projectId = 'munazzim-failure-recovery-test';
const app = getApps().find((item) => item.name === projectId) || initializeApp({ projectId }, projectId);
const db = getFirestore(app);
const prefix = `endurance-${Date.now()}`;
let successful = 0;
let expectedRejections = 0;
let unexpectedFailures = 0;
let duplicateWrites = 0;
let corruptedWrites = 0;

async function run(operation) {
  try { await operation(); successful += 1; } catch (error) { unexpectedFailures += 1; console.error(error.message); }
}

(async () => {
  const recoveryId = `${prefix}-recovery`;
  await db.collection('tasks').doc(recoveryId).set({ userId: 'security-test', title: 'recovered' });
  const recovered = await db.collection('tasks').doc(recoveryId).get();
  if (!recovered.exists || recovered.data().title !== 'recovered') throw new Error('Recovery record missing or corrupted');
  successful += 1;

  for (let index = 0; index < 10; index += 1) await run(() => db.collection('tasks').doc(`${prefix}-task-${index}`).set({ userId: 'security-test', title: `task-${index}` }));
  for (let index = 0; index < 5; index += 1) await run(() => db.collection('appointments').doc(`${prefix}-appointment-${index}`).set({ userId: 'security-test', title: `appointment-${index}` }));
  for (let index = 0; index < 5; index += 1) await run(async () => {
    const snapshot = await db.collection('tasks').doc(`${prefix}-task-${index}`).get();
    if (!snapshot.exists || snapshot.data().title !== `task-${index}`) corruptedWrites += 1;
  });
  for (let index = 0; index < 5; index += 1) await run(async () => {
    const reference = db.collection('tasks').doc(`${prefix}-duplicate-${index}`);
    await reference.create({ userId: 'security-test', title: `duplicate-${index}` });
    try { await reference.create({ userId: 'security-test', title: `duplicate-${index}` }); duplicateWrites += 1; }
    catch { expectedRejections += 1; }
  });

  const snapshot = await db.collection('tasks').where('userId', '==', 'security-test').get();
  await Promise.all(snapshot.docs.map((document) => document.ref.delete()));
  const appointments = await db.collection('appointments').where('userId', '==', 'security-test').get();
  await Promise.all(appointments.docs.map((document) => document.ref.delete()));
  console.log(JSON.stringify({ totalOperations: 26, successful, expectedRejections, unexpectedFailures, processCrashes: 0, duplicateWrites, corruptedWrites, recovery: 'PASS' }));
  if (unexpectedFailures || duplicateWrites || corruptedWrites) process.exit(1);
})();