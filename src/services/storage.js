import { db, auth } from './firebase.js';
import { doc, getDoc, setDoc, collection, addDoc, query, where, getDocs, orderBy } from 'firebase/firestore';

export async function getProfile() {
  const user = auth.currentUser;
  if (!user) return null;
  const docSnap = await getDoc(doc(db, "users", user.uid));
  if (docSnap.exists()) {
    const data = docSnap.data();
    
    // Patch old patients who don't have a patientCode
    if (data.role === 'patient' && !data.patientCode) {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      await setDoc(doc(db, "users", user.uid), { patientCode: code }, { merge: true });
      data.patientCode = code;
    }
    
    return data;
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

import { deleteUser } from 'firebase/auth';

export async function clearAllData() {
  await auth.signOut();
}

export async function deleteAccount() {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  
  // Delete profile
  const { deleteDoc } = await import('firebase/firestore');
  await deleteDoc(doc(db, "users", user.uid));
  
  // Delete logs
  const logs = await getLogs();
  for (const log of logs) {
    await deleteDoc(doc(db, "wellnessLogs", log.id));
  }
  
  // Delete metric logs
  const metrics = await getMetricLogs();
  for (const metric of metrics) {
    await deleteDoc(doc(db, "metricLogs", metric.id));
  }
  
  // Delete Firebase auth user
  await deleteUser(user);
}

// Doctor specific functions
export async function linkPatientToDoctor(patientCode) {
  const doctor = auth.currentUser;
  if (!doctor) throw new Error("Not authenticated");
  
  // Find the patient by their 6-character code
  const q = query(collection(db, "users"), where("patientCode", "==", patientCode), where("role", "==", "patient"));
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    throw new Error("No patient found with that code.");
  }
  
  const patientDoc = querySnapshot.docs[0];
  const patientUid = patientDoc.id;
  
  // Get doctor's current patients array
  const doctorDocRef = doc(db, "users", doctor.uid);
  const doctorSnap = await getDoc(doctorDocRef);
  
  let patients = [];
  if (doctorSnap.exists() && doctorSnap.data().patients) {
    patients = doctorSnap.data().patients;
  }
  
  if (!patients.includes(patientUid)) {
    patients.push(patientUid);
    await setDoc(doctorDocRef, { patients }, { merge: true });
  }
  
  return { id: patientUid, ...patientDoc.data() };
}

export async function getDoctorPatients() {
  const doctor = auth.currentUser;
  if (!doctor) return [];
  
  const doctorSnap = await getDoc(doc(db, "users", doctor.uid));
  if (!doctorSnap.exists() || !doctorSnap.data().patients || doctorSnap.data().patients.length === 0) {
    return [];
  }
  
  const patientUids = doctorSnap.data().patients;
  const patientsList = [];
  
  for (const uid of patientUids) {
    const pSnap = await getDoc(doc(db, "users", uid));
    if (pSnap.exists()) {
      patientsList.push({ id: uid, ...pSnap.data() });
    }
  }
  
  return patientsList;
}

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
