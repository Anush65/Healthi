import { db, auth, isDemoMode } from './firebase.js';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where
} from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';

const STORE_KEY = 'healthi-demo-v2';
const SESSION_KEY = 'healthi-demo-role';
const memoryStore = new Map();
const browserStorage = typeof localStorage !== 'undefined' ? localStorage : {
  getItem: (key) => memoryStore.get(key) ?? null,
  setItem: (key, value) => memoryStore.set(key, value),
  removeItem: (key) => memoryStore.delete(key)
};

const daysAgo = (days, hour = 9) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};

function seedStore() {
  return {
    profiles: {
      patient: {
        id: 'demo-patient',
        role: 'patient',
        name: 'Maya Rao',
        age: 68,
        email: 'maya@example.com',
        patientCode: 'HLT729',
        conditions: ['hypertension', 'diabetes', 'temperature', 'oxygen_level', 'body_weight'],
        medications: ['Metformin 500mg', 'Amlodipine 5mg'],
        onboardingComplete: true
      },
      doctor: {
        id: 'demo-doctor',
        role: 'doctor',
        name: 'Dr. Arjun Mehta',
        specialty: 'Internal Medicine',
        email: 'arjun@example.com',
        patients: ['demo-patient'],
        onboardingComplete: true
      }
    },
    logs: [
      { id: 'log-1', patientId: 'demo-patient', date: daysAgo(35, 20), raw_text: 'Feeling okay, but had a slight headache in the evening. Didn\'t sleep very well.', parsed_data: { symptoms: ['headache'], sleep: 'poor', severity: 'low', summary: 'Evening headache and poor sleep.' } },
      { id: 'log-2', patientId: 'demo-patient', date: daysAgo(32, 9), raw_text: 'Headaches are getting more frequent. Blood pressure seems a bit high today.', parsed_data: { symptoms: ['headache'], sleep: 'fair', severity: 'medium', summary: 'Frequent headaches and high BP.' } },
      { id: 'log-3', patientId: 'demo-patient', date: daysAgo(28, 8), raw_text: 'Woke up very dizzy. Skipped my morning walk. Blood pressure is definitely too high.', parsed_data: { symptoms: ['dizziness'], sleep: 'poor', severity: 'high', summary: 'Dizzy morning, skipped walk.' } },
      { id: 'log-4', patientId: 'demo-patient', date: daysAgo(25, 14), raw_text: 'Visited the doctor today. He prescribed Amlodipine for the blood pressure spikes.', parsed_data: { symptoms: [], sleep: 'fair', severity: 'low', summary: 'Doctor visit for BP spikes.' } },
      { id: 'log-5', patientId: 'demo-patient', date: daysAgo(22, 10), raw_text: 'Started the new medicine. Feeling a bit fatigued and still dizzy, but my BP is coming down.', parsed_data: { symptoms: ['fatigue', 'dizziness'], sleep: 'fair', severity: 'medium', summary: 'Fatigue from new medication.' } },
      { id: 'log-6', patientId: 'demo-patient', date: daysAgo(18, 9), raw_text: 'Fatigue is wearing off. Sleep was much better last night. Walked for 15 mins.', parsed_data: { symptoms: [], sleep: 'good', severity: 'low', summary: 'Improving energy and better sleep.' } },
      { id: 'log-7', patientId: 'demo-patient', date: daysAgo(14, 18), raw_text: 'Feeling much more energetic. The new medicine is working well. BP is stable.', parsed_data: { symptoms: [], sleep: 'good', severity: 'low', summary: 'Energetic and stable BP.' } },
      { id: 'log-8', patientId: 'demo-patient', date: daysAgo(10, 11), raw_text: 'Great day. Walked for 30 minutes in the park. No headaches.', parsed_data: { symptoms: [], sleep: 'excellent', severity: 'low', summary: '30 min walk, feeling great.' } },
      { id: 'log-9', patientId: 'demo-patient', date: daysAgo(6, 8), raw_text: 'Slept excellently. Blood sugar and BP are both perfect. Feeling like my old self.', parsed_data: { symptoms: [], sleep: 'excellent', severity: 'low', summary: 'Perfect metrics, excellent sleep.' } },
      { id: 'log-10', patientId: 'demo-patient', date: daysAgo(1, 9), raw_text: 'Very energetic. Consistent walks are helping. Ready for my follow-up appointment next week!', parsed_data: { symptoms: [], sleep: 'good', severity: 'low', summary: 'Energetic and ready for follow-up.' } }
    ],
    metrics: [
      { id: 'm1', patientId: 'demo-patient', condition: 'hypertension', date: daysAgo(35), metrics: { systolic: 135, diastolic: 85 } },
      { id: 'm2', patientId: 'demo-patient', condition: 'hypertension', date: daysAgo(32), metrics: { systolic: 142, diastolic: 88 } },
      { id: 'm3', patientId: 'demo-patient', condition: 'hypertension', date: daysAgo(28), metrics: { systolic: 155, diastolic: 95 } },
      { id: 'm4', patientId: 'demo-patient', condition: 'hypertension', date: daysAgo(25), metrics: { systolic: 150, diastolic: 92 } },
      { id: 'm5', patientId: 'demo-patient', condition: 'hypertension', date: daysAgo(22), metrics: { systolic: 138, diastolic: 86 } },
      { id: 'm6', patientId: 'demo-patient', condition: 'hypertension', date: daysAgo(14), metrics: { systolic: 130, diastolic: 82 } },
      { id: 'm7', patientId: 'demo-patient', condition: 'hypertension', date: daysAgo(6), metrics: { systolic: 125, diastolic: 80 } },
      { id: 'm8', patientId: 'demo-patient', condition: 'hypertension', date: daysAgo(1), metrics: { systolic: 122, diastolic: 78 } },

      { id: 'm9', patientId: 'demo-patient', condition: 'diabetes', date: daysAgo(35), metrics: { blood_sugar: 120 } },
      { id: 'm10', patientId: 'demo-patient', condition: 'diabetes', date: daysAgo(28), metrics: { blood_sugar: 130 } },
      { id: 'm11', patientId: 'demo-patient', condition: 'diabetes', date: daysAgo(22), metrics: { blood_sugar: 125 } },
      { id: 'm12', patientId: 'demo-patient', condition: 'diabetes', date: daysAgo(14), metrics: { blood_sugar: 115 } },
      { id: 'm13', patientId: 'demo-patient', condition: 'diabetes', date: daysAgo(6), metrics: { blood_sugar: 108 } },
      { id: 'm14', patientId: 'demo-patient', condition: 'diabetes', date: daysAgo(1), metrics: { blood_sugar: 105 } }
    ],
    appointments: [
      {
        id: 'apt-1',
        patientId: 'demo-patient',
        doctorId: 'demo-doctor',
        doctorName: 'Dr. Arjun Mehta',
        scheduledDate: daysAgo(-4, 10),
        status: 'scheduled',
        reason: 'Monthly Review',
        notes: 'Check blood pressure progress after starting Amlodipine.'
      }
    ],
    visits: [
      {
        id: 'visit-1',
        patientId: 'demo-patient',
        doctorId: 'demo-doctor',
        date: daysAgo(25, 14),
        diagnosis: 'Hypertension Spikes',
        prescriptions: [{ medicine: 'Amlodipine', dosage: '5mg', frequency: 'Daily tracking', duration: 'Ongoing' }],
        testsOrdered: [],
        recommendations: 'Start Amlodipine daily. Begin light 15-minute walks once dizziness subsides.',
        doctorNotes: 'Patient reporting frequent headaches and dizziness. BP elevated.'
      }
    ]
  };
}

function readStore() {
  const raw = browserStorage.getItem(STORE_KEY);
  if (raw) return JSON.parse(raw);
  const store = seedStore();
  browserStorage.setItem(STORE_KEY, JSON.stringify(store));
  return store;
}

function writeStore(store) {
  browserStorage.setItem(STORE_KEY, JSON.stringify(store));
}

export function getDemoRole() {
  return browserStorage.getItem(SESSION_KEY);
}

export function startDemo(role) {
  browserStorage.setItem(SESSION_KEY, role);
}

export function endDemo() {
  browserStorage.removeItem(SESSION_KEY);
}

function currentDemoId() {
  return getDemoRole() === 'doctor' ? 'demo-doctor' : 'demo-patient';
}

export async function getProfile() {
  if (isDemoMode) {
    const role = getDemoRole();
    return role ? readStore().profiles[role] : null;
  }
  const user = auth.currentUser;
  if (!user) return null;
  const snap = await getDoc(doc(db, 'users', user.uid));
  if (!snap.exists()) return null;
  const profile = snap.data();
  if (profile.role === 'patient' && profile.patientCode) {
    await setDoc(doc(db, 'patientCodes', profile.patientCode), {
      patientId: user.uid,
      createdAt: profile.createdAt || serverTimestamp()
    }, { merge: true });
  }
  return profile;
}

export async function setProfile(data) {
  if (isDemoMode) {
    const role = getDemoRole() || data.role || 'patient';
    const store = readStore();
    store.profiles[role] = { ...store.profiles[role], ...data };
    writeStore(store);
    return;
  }
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  const profile = { ...data, updatedAt: serverTimestamp() };
  await setDoc(doc(db, 'users', user.uid), profile, { merge: true });

  if (profile.role === 'patient' && profile.patientCode) {
    await setDoc(doc(db, 'patientCodes', profile.patientCode), {
      patientId: user.uid,
      createdAt: serverTimestamp()
    });
  }
}

export async function updatePatientProfile(patientId, data) {
  if (isDemoMode) {
    const store = readStore();
    store.profiles.patient = { ...store.profiles.patient, ...data };
    writeStore(store);
    return;
  }
  const doctor = auth.currentUser;
  if (!doctor) throw new Error('Not authenticated');
  const profile = { ...data, updatedAt: serverTimestamp() };
  await setDoc(doc(db, 'users', patientId), profile, { merge: true });
}


export async function createUserProfile(data) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  const profile = {
    name: user.displayName || data.name || 'Healthi user',
    email: user.email || data.email || '',
    phone: user.phoneNumber || '',
    conditions: [],
    medications: [],
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  await setDoc(doc(db, 'users', user.uid), profile);
  if (profile.role === 'patient' && profile.patientCode) {
    await setDoc(doc(db, 'patientCodes', profile.patientCode), {
      patientId: user.uid,
      createdAt: serverTimestamp()
    });
  }
  return profile;
}

export async function getLogs() {
  if (isDemoMode) return readStore().logs.filter((log) => log.patientId === 'demo-patient');
  const user = auth.currentUser;
  if (!user) return [];
  return getPatientLogs(user.uid);
}

export async function addLog(logData) {
  if (isDemoMode) {
    const store = readStore();
    const log = { ...logData, id: crypto.randomUUID(), patientId: 'demo-patient', date: new Date().toISOString() };
    store.logs.push(log);
    writeStore(store);
    return log.id;
  }
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  const ref = await addDoc(collection(db, 'healthEntries'), {
    ...logData,
    patientId: user.uid,
    date: new Date().toISOString(),
    createdAt: serverTimestamp()
  });
  return ref.id;
}

export async function getLogsByDateRange(startDate, endDate) {
  return (await getLogs()).filter((log) => {
    const date = new Date(log.date);
    return date >= startDate && date <= endDate;
  });
}

export async function getMetricLogs() {
  if (isDemoMode) return readStore().metrics.filter((log) => log.patientId === 'demo-patient');
  const user = auth.currentUser;
  if (!user) return [];
  return getPatientMetricLogs(user.uid);
}

export async function addMetricLog(metricData) {
  if (isDemoMode) {
    const store = readStore();
    store.metrics.push({
      ...metricData,
      id: crypto.randomUUID(),
      patientId: metricData.patientId || 'demo-patient',
      date: new Date().toISOString()
    });
    writeStore(store);
    return;
  }
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  await addDoc(collection(db, 'metricLogs'), {
    ...metricData,
    patientId: metricData.patientId || user.uid,
    date: new Date().toISOString(),
    createdAt: serverTimestamp()
  });
}

export async function getAppointments(patientId) {
  if (isDemoMode) return readStore().appointments.filter((item) => item.patientId === (patientId || 'demo-patient'));
  const resolvedPatientId = patientId || auth.currentUser?.uid;
  if (!resolvedPatientId) return [];
  const q = query(collection(db, 'appointments'), where('patientId', '==', resolvedPatientId));
  return snapshotToArray(await getDocs(q));
}

export async function updateAppointment(id, updates) {
  if (isDemoMode) {
    const store = readStore();
    const index = store.appointments.findIndex((item) => item.id === id);
    store.appointments[index] = { ...store.appointments[index], ...updates };
    writeStore(store);
    return;
  }
  await setDoc(doc(db, 'appointments', id), { ...updates, updatedAt: serverTimestamp() }, { merge: true });
}

export async function addAppointment(data) {
  if (isDemoMode) {
    const store = readStore();
    store.appointments.push({ ...data, id: crypto.randomUUID(), doctorId: currentDemoId() });
    writeStore(store);
    return;
  }
  const doctor = auth.currentUser;
  if (!doctor) throw new Error('Not authenticated');
  const doctorProfile = await getProfile();
  await addDoc(collection(db, 'appointments'), {
    ...data,
    doctorId: doctor.uid,
    doctorName: doctorProfile?.name || 'Your doctor',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export async function getVisits(patientId) {
  if (isDemoMode) return readStore().visits.filter((item) => item.patientId === (patientId || 'demo-patient'));
  const resolvedPatientId = patientId || auth.currentUser?.uid;
  if (!resolvedPatientId) return [];
  const q = query(collection(db, 'doctorVisits'), where('patientId', '==', resolvedPatientId));
  return snapshotToArray(await getDocs(q));
}

export async function addVisit(data) {
  if (isDemoMode) {
    const store = readStore();
    store.visits.push({
      ...data,
      id: crypto.randomUUID(),
      doctorId: 'demo-doctor',
      date: new Date().toISOString()
    });
    writeStore(store);
    return;
  }
  const doctor = auth.currentUser;
  if (!doctor) throw new Error('Not authenticated');
  await addDoc(collection(db, 'doctorVisits'), {
    ...data,
    doctorId: doctor.uid,
    date: new Date().toISOString(),
    createdAt: serverTimestamp()
  });
}

export async function clearAllData() {
  if (isDemoMode) {
    browserStorage.removeItem(STORE_KEY);
    endDemo();
    return;
  }
  await auth.signOut();
}

export async function deleteAccount() {
  if (isDemoMode) {
    await clearAllData();
    return;
  }
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  const profileSnap = await getDoc(doc(db, 'users', user.uid));
  const profile = profileSnap.data();

  if (profile?.role === 'patient') {
    const ownedCollections = ['healthEntries', 'metricLogs', 'appointments', 'doctorVisits'];
    for (const collectionName of ownedCollections) {
      const ownedQuery = query(collection(db, collectionName), where('patientId', '==', user.uid));
      const ownedDocs = await getDocs(ownedQuery);
      await Promise.all(ownedDocs.docs.map((item) => deleteDoc(item.ref)));
    }

    const assignmentsQuery = query(
      collection(db, 'doctorAssignments'),
      where('patientId', '==', user.uid)
    );
    const assignments = await getDocs(assignmentsQuery);
    await Promise.all(assignments.docs.map((item) => deleteDoc(item.ref)));

    if (profile.patientCode) {
      await deleteDoc(doc(db, 'patientCodes', profile.patientCode));
    }
  } else if (profile?.role === 'doctor') {
    const assignmentsQuery = query(
      collection(db, 'doctorAssignments'),
      where('doctorId', '==', user.uid)
    );
    const assignments = await getDocs(assignmentsQuery);
    await Promise.all(assignments.docs.map((item) => deleteDoc(item.ref)));
  }

  await deleteDoc(doc(db, 'users', user.uid));
  await deleteUser(user);
}

export async function linkPatientToDoctor(patientCode) {
  if (isDemoMode) {
    if (patientCode !== readStore().profiles.patient.patientCode) throw new Error('No patient found with that code.');
    return { ...readStore().profiles.patient };
  }
  const doctor = auth.currentUser;
  if (!doctor) throw new Error('Not authenticated');
  const codeSnap = await getDoc(doc(db, 'patientCodes', patientCode));
  if (!codeSnap.exists()) throw new Error('No patient found with that code.');
  const patientId = codeSnap.data().patientId;
  await setDoc(doc(db, 'doctorAssignments', `${doctor.uid}_${patientId}`), {
    doctorId: doctor.uid,
    patientId,
    patientCode,
    createdAt: serverTimestamp()
  });
  const patient = await getDoc(doc(db, 'users', patientId));
  return { id: patient.id, ...patient.data() };
}

export async function getDoctorPatients() {
  if (isDemoMode) return [{ ...readStore().profiles.patient }];
  const doctor = auth.currentUser;
  if (!doctor) return [];
  const assignmentsQuery = query(
    collection(db, 'doctorAssignments'),
    where('doctorId', '==', doctor.uid)
  );
  const assignments = await getDocs(assignmentsQuery);
  return Promise.all(assignments.docs.map(async (assignment) => {
    const id = assignment.data().patientId;
    const patient = await getDoc(doc(db, 'users', id));
    return patient.exists() ? { id, ...patient.data() } : null;
  })).then((patients) => patients.filter(Boolean));
}

export async function getPatientProfile(patientUid) {
  if (isDemoMode) return readStore().profiles.patient;
  const snap = await getDoc(doc(db, 'users', patientUid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getPatientLogs(patientUid) {
  if (isDemoMode) return readStore().logs.filter((log) => log.patientId === 'demo-patient');
  const q = query(collection(db, 'healthEntries'), where('patientId', '==', patientUid));
  return snapshotToArray(await getDocs(q)).sort((a, b) => new Date(b.date) - new Date(a.date));
}

export async function getPatientMetricLogs(patientUid) {
  if (isDemoMode) return readStore().metrics.filter((log) => log.patientId === 'demo-patient');
  const q = query(collection(db, 'metricLogs'), where('patientId', '==', patientUid));
  return snapshotToArray(await getDocs(q)).sort((a, b) => new Date(a.date) - new Date(b.date));
}

export async function toggleMedicationLog(patientId, medicineName, dateStr, taken) {
  const resolvedPatientId = patientId || (isDemoMode ? 'demo-patient' : auth.currentUser?.uid);
  if (!resolvedPatientId) throw new Error('Not authenticated');

  if (isDemoMode) {
    const store = readStore();
    store.medicationLogs = store.medicationLogs || [];
    if (taken) {
      store.medicationLogs.push({ patientId: resolvedPatientId, medicineName, dateStr });
    } else {
      store.medicationLogs = store.medicationLogs.filter(l => !(l.patientId === resolvedPatientId && l.medicineName === medicineName && l.dateStr === dateStr));
    }
    writeStore(store);
    return;
  }
  const docId = `${resolvedPatientId}_${dateStr}_${medicineName.replace(/[^a-zA-Z0-9]/g, '')}`;
  const docRef = doc(db, 'medicationLogs', docId);
  if (taken) {
    await setDoc(docRef, { patientId: resolvedPatientId, medicineName, dateStr, createdAt: serverTimestamp() });
  } else {
    await deleteDoc(docRef);
  }
}

export async function getMedicationLogs(patientId, dateStr) {
  const resolvedPatientId = patientId || (isDemoMode ? 'demo-patient' : auth.currentUser?.uid);
  if (!resolvedPatientId) return [];

  if (isDemoMode) {
    const store = readStore();
    return (store.medicationLogs || []).filter(l => l.patientId === resolvedPatientId && l.dateStr === dateStr);
  }
  const q = query(collection(db, 'medicationLogs'), where('patientId', '==', resolvedPatientId), where('dateStr', '==', dateStr));
  return snapshotToArray(await getDocs(q));
}

function snapshotToArray(snapshot) {
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export async function seedCurrentPatient() {
  const profile = await getProfile();
  if (!profile || profile.role !== 'patient') throw new Error('Must be logged in as a patient to seed data.');
  
  const user = auth.currentUser;
  const daysAgo = (days, hour = 9) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    d.setHours(hour, 0, 0, 0);
    return d.toISOString();
  };

  // Find the required doctor by email
  const doctorQuery = query(collection(db, 'users'), where('email', '==', 'aadhyanth.k2024@vitstudent.ac.in'), where('role', '==', 'doctor'));
  const doctorSnap = await getDocs(doctorQuery);
  let doctorId = 'demo-doctor';
  let doctorName = 'Dr. Arjun Mehta';
  
  if (!doctorSnap.empty) {
    const docData = doctorSnap.docs[0];
    doctorId = docData.id;
    doctorName = docData.data().name || doctorName;

    // Link the patient to this doctor
    await setDoc(doc(db, 'doctorAssignments', `${doctorId}_${user.uid}`), {
      doctorId,
      patientId: user.uid,
      patientCode: profile.patientCode || 'HLT729',
      createdAt: serverTimestamp()
    });
  }

  const logs = [
    { date: daysAgo(35, 20), raw_text: 'Feeling okay, but had a slight headache in the evening. Didn\'t sleep very well.', parsed_data: { symptoms: ['headache'], sleep: 'poor', severity: 'low', summary: 'Evening headache and poor sleep.' } },
    { date: daysAgo(32, 9), raw_text: 'Headaches are getting more frequent. Blood pressure seems a bit high today.', parsed_data: { symptoms: ['headache'], sleep: 'fair', severity: 'medium', summary: 'Frequent headaches and high BP.' } },
    { date: daysAgo(28, 8), raw_text: 'Woke up very dizzy. Skipped my morning walk. Blood pressure is definitely too high.', parsed_data: { symptoms: ['dizziness'], sleep: 'poor', severity: 'high', summary: 'Dizzy morning, skipped walk.' } },
    { date: daysAgo(25, 14), raw_text: 'Visited the doctor today. He prescribed Amlodipine for the blood pressure spikes.', parsed_data: { symptoms: [], sleep: 'fair', severity: 'low', summary: 'Doctor visit for BP spikes.' } },
    { date: daysAgo(22, 10), raw_text: 'Started the new medicine. Feeling a bit fatigued and still dizzy, but my BP is coming down.', parsed_data: { symptoms: ['fatigue', 'dizziness'], sleep: 'fair', severity: 'medium', summary: 'Fatigue from new medication.' } },
    { date: daysAgo(18, 9), raw_text: 'Fatigue is wearing off. Sleep was much better last night. Walked for 15 mins.', parsed_data: { symptoms: [], sleep: 'good', severity: 'low', summary: 'Improving energy and better sleep.' } },
    { date: daysAgo(14, 18), raw_text: 'Feeling much more energetic. The new medicine is working well. BP is stable.', parsed_data: { symptoms: [], sleep: 'good', severity: 'low', summary: 'Energetic and stable BP.' } },
    { date: daysAgo(10, 11), raw_text: 'Great day. Walked for 30 minutes in the park. No headaches.', parsed_data: { symptoms: [], sleep: 'excellent', severity: 'low', summary: '30 min walk, feeling great.' } },
    { date: daysAgo(6, 8), raw_text: 'Slept excellently. Blood sugar and BP are both perfect. Feeling like my old self.', parsed_data: { symptoms: [], sleep: 'excellent', severity: 'low', summary: 'Perfect metrics, excellent sleep.' } },
    { date: daysAgo(1, 9), raw_text: 'Very energetic. Consistent walks are helping. Ready for my follow-up appointment next week!', parsed_data: { symptoms: [], sleep: 'good', severity: 'low', summary: 'Energetic and ready for follow-up.' } }
  ];

  const metrics = [
    { condition: 'hypertension', date: daysAgo(35), metrics: { systolic: 135, diastolic: 85 } },
    { condition: 'hypertension', date: daysAgo(32), metrics: { systolic: 142, diastolic: 88 } },
    { condition: 'hypertension', date: daysAgo(28), metrics: { systolic: 155, diastolic: 95 } },
    { condition: 'hypertension', date: daysAgo(25), metrics: { systolic: 150, diastolic: 92 } },
    { condition: 'hypertension', date: daysAgo(22), metrics: { systolic: 138, diastolic: 86 } },
    { condition: 'hypertension', date: daysAgo(14), metrics: { systolic: 130, diastolic: 82 } },
    { condition: 'hypertension', date: daysAgo(6), metrics: { systolic: 125, diastolic: 80 } },
    { condition: 'hypertension', date: daysAgo(1), metrics: { systolic: 122, diastolic: 78 } },

    { condition: 'diabetes', date: daysAgo(35), metrics: { blood_sugar: 120 } },
    { condition: 'diabetes', date: daysAgo(28), metrics: { blood_sugar: 130 } },
    { condition: 'diabetes', date: daysAgo(22), metrics: { blood_sugar: 125 } },
    { condition: 'diabetes', date: daysAgo(14), metrics: { blood_sugar: 115 } },
    { condition: 'diabetes', date: daysAgo(6), metrics: { blood_sugar: 108 } },
    { condition: 'diabetes', date: daysAgo(1), metrics: { blood_sugar: 105 } }
  ];

  const appointments = [
    {
      doctorId,
      doctorName,
      scheduledDate: daysAgo(-4, 10),
      status: 'scheduled',
      reason: 'Monthly Review',
      notes: 'Check blood pressure progress after starting Amlodipine.'
    }
  ];

  const visits = [
    {
      doctorId,
      date: daysAgo(25, 14),
      diagnosis: 'Hypertension Spikes',
      prescriptions: [{ medicine: 'Amlodipine', dosage: '5mg', frequency: 'Daily tracking', duration: 'Ongoing' }],
      testsOrdered: [],
      recommendations: 'Start Amlodipine daily. Begin light 15-minute walks once dizziness subsides.',
      doctorNotes: 'Patient reporting frequent headaches and dizziness. BP elevated.'
    }
  ];

  const promises = [];

  // 1. Health Logs
  for (const log of logs) {
    promises.push(addDoc(collection(db, 'healthEntries'), {
      ...log,
      patientId: user.uid,
      createdAt: serverTimestamp()
    }));
  }

  // 2. Metric Logs
  for (const metric of metrics) {
    if (profile.conditions?.includes(metric.condition)) {
      promises.push(addDoc(collection(db, 'metricLogs'), {
        ...metric,
        patientId: user.uid,
        createdAt: serverTimestamp()
      }));
    }
  }

  // 3. Appointments & Visits
  for (const apt of appointments) {
    promises.push(addDoc(collection(db, 'appointments'), {
      ...apt,
      patientId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }));
  }

  for (const visit of visits) {
    promises.push(addDoc(collection(db, 'doctorVisits'), {
      ...visit,
      patientId: user.uid,
      createdAt: serverTimestamp()
    }));
  }

  // 4. Update Profile with Medicines
  promises.push(setDoc(doc(db, 'users', user.uid), {
    medicines: [
      { name: 'Amlodipine', instructions: '5mg', timing: '1-0-0' }
    ]
  }, { merge: true }));

  // 5. Seed Medication checklist logs (Past 24 days since visit)
  // Generating logs for they took their meds every day
  for (let i = 24; i >= 0; i--) {
    const dStr = daysAgo(i).substring(0, 10); // get YYYY-MM-DD from ISO
    const docId = `${user.uid}_${dStr}_Amlodipine`;
    promises.push(setDoc(doc(db, 'medicationLogs', docId), {
      patientId: user.uid,
      medicineName: 'Amlodipine',
      dateStr: dStr,
      createdAt: serverTimestamp()
    }));
  }

  await Promise.all(promises);
}
