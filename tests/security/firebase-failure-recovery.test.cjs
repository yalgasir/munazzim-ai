const { initializeApp, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const projectId = 'munazzim-failure-recovery-test';
const app = getApps().find((item) => item.name === projectId) || initializeApp({ projectId }, projectId);
const db = getFirestore(app);
const id = `failure-recovery-${Date.now()}`;

(async () => {
  try {
    await db.collection('tasks').doc(id).set({ userId: 'security-test', title: 'must not persist' });
    console.error('FIREBASE FAILURE: unexpected write success');
    process.exit(1);
  } catch (error) {
    console.log(`FIREBASE FAILURE: controlled error ${error.code || error.name}`);
  }
})();