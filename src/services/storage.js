import { db, auth } from './firebase.js';
import { doc, getDoc, setDoc, collection, addDoc, query, where, getDocs, orderBy } from 'firebase/firestore';

export async function getProfile() {
  const user = auth.currentUser;
  if (!user) return null;
  const docSnap = await getDoc(doc(db, "users", user.uid));
  if (docSnap.exists()) {
    return docSnap.data();
  }
  return null;
}

export async function setProfile(data) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  await setDoc(doc(db, "users", user.uid), data, { merge: true });
}

export async function getLogs() {
  const user = auth.currentUser;
  if (!user) return [];
  const q = query(collection(db, "wellnessLogs"), where("patientId", "==", user.uid)); // Removing orderBy temporarily to avoid index requirements for hackathon
  const querySnapshot = await getDocs(q);
  const logs = [];
  querySnapshot.forEach((doc) => {
    logs.push({ id: doc.id, ...doc.data() });
  });
  return logs.sort((a, b) => new Date(b.date) - new Date(a.date));
}

export async function addLog(logData) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  const docRef = await addDoc(collection(db, "wellnessLogs"), {
    ...logData,
    patientId: user.uid,
    date: new Date().toISOString()
  });
  return docRef.id;
}

export async function getLogsByDateRange(startDate, endDate) {
  const logs = await getLogs();
  return logs.filter(log => {
    const d = new Date(log.date);
    return d >= startDate && d <= endDate;
  });
}

export async function getMetricLogs() {
  const user = auth.currentUser;
  if (!user) return [];
  const q = query(collection(db, "metricLogs"), where("patientId", "==", user.uid));
  const querySnapshot = await getDocs(q);
  const logs = [];
  querySnapshot.forEach((doc) => {
    logs.push({ id: doc.id, ...doc.data() });
  });
  return logs.sort((a, b) => new Date(a.date) - new Date(b.date));
}

export async function addMetricLog(metricData) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  const docRef = await addDoc(collection(db, "metricLogs"), {
    ...metricData,
    patientId: user.uid,
    date: new Date().toISOString()
  });
  return docRef.id;
}

export async function clearAllData() {
  await auth.signOut();
}

// Doctor specific functions
export async function getPatientProfile(patientUid) {
  if (!patientUid) return null;
  const docSnap = await getDoc(doc(db, "users", patientUid));
  if (docSnap.exists()) {
    return docSnap.data();
  }
  return null;
}

export async function getPatientLogs(patientUid) {
  if (!patientUid) return [];
  const q = query(collection(db, "wellnessLogs"), where("patientId", "==", patientUid));
  const querySnapshot = await getDocs(q);
  const logs = [];
  querySnapshot.forEach((doc) => {
    logs.push({ id: doc.id, ...doc.data() });
  });
  return logs.sort((a, b) => new Date(b.date) - new Date(a.date));
}

export async function getPatientMetricLogs(patientUid) {
  if (!patientUid) return [];
  const q = query(collection(db, "metricLogs"), where("patientId", "==", patientUid));
  const querySnapshot = await getDocs(q);
  const logs = [];
  querySnapshot.forEach((doc) => {
    logs.push({ id: doc.id, ...doc.data() });
  });
  return logs.sort((a, b) => new Date(a.date) - new Date(b.date));
}
