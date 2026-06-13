import { auth, db } from '../services/firebase.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { showToast } from '../utils/toast.js';

export async function render() {
  return `
    <div style="margin-top: 40px; animation: slideDown 0.4s ease-out; max-width: 400px; margin-left: auto; margin-right: auto;">
      <div class="card">
        <h2 style="text-align: center; margin-bottom: 24px;">Welcome to Healthi</h2>
        
        <div style="display: flex; gap: 8px; margin-bottom: 24px;">
          <button id="tab-login" class="btn-primary" style="flex: 1;">Login</button>
          <button id="tab-register" class="btn-primary" style="flex: 1; background: var(--slate-200); color: var(--text-primary);">Register</button>
        </div>

        <form id="auth-form">
          <div id="role-selection" style="display: none; margin-bottom: 16px;">
            <label style="display: block; font-weight: 500; margin-bottom: 8px;">I am a:</label>
            <div style="display: flex; gap: 16px;">
              <label style="display: flex; align-items: center;"><input type="radio" name="role" value="patient" checked style="margin-right: 8px;"> Patient</label>
              <label style="display: flex; align-items: center;"><input type="radio" name="role" value="doctor" style="margin-right: 8px;"> Doctor</label>
            </div>
          </div>
          
          <label style="display: block; font-weight: 500; margin-bottom: 8px;">Email</label>
          <input type="email" id="email" required style="width: 100%; padding: 12px; border: 1px solid var(--border-color); border-radius: var(--radius-button); font-size: 1rem; margin-bottom: 16px;">
          
          <label style="display: block; font-weight: 500; margin-bottom: 8px;">Password</label>
          <input type="password" id="password" required style="width: 100%; padding: 12px; border: 1px solid var(--border-color); border-radius: var(--radius-button); font-size: 1rem; margin-bottom: 24px;">
          
          <button type="submit" id="submit-btn" class="btn-primary" style="width: 100%; padding: 16px; font-size: 1.1rem;">Login</button>
        </form>
      </div>
    </div>
  `;
}

export function init() {
  let isLogin = true;
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const roleSelection = document.getElementById('role-selection');
  const submitBtn = document.getElementById('submit-btn');
  const form = document.getElementById('auth-form');

  tabLogin.addEventListener('click', () => {
    isLogin = true;
    tabLogin.style.background = 'var(--blue-600)';
    tabLogin.style.color = 'white';
    tabRegister.style.background = 'var(--slate-200)';
    tabRegister.style.color = 'var(--text-primary)';
    roleSelection.style.display = 'none';
    submitBtn.textContent = 'Login';
  });

  tabRegister.addEventListener('click', () => {
    isLogin = false;
    tabRegister.style.background = 'var(--blue-600)';
    tabRegister.style.color = 'white';
    tabLogin.style.background = 'var(--slate-200)';
    tabLogin.style.color = 'var(--text-primary)';
    roleSelection.style.display = 'block';
    submitBtn.textContent = 'Register';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.5';

      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const docRef = await getDoc(doc(db, "users", userCredential.user.uid));
        
        if (docRef.exists()) {
          const role = docRef.data().role;
          if (role === 'doctor') {
            window.location.hash = '#/doctor-dashboard';
          } else {
            window.location.hash = '#/dashboard';
          }
        } else {
          window.location.hash = '#/dashboard';
        }
      } else {
        const role = document.querySelector('input[name="role"]:checked').value;
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        await setDoc(doc(db, "users", userCredential.user.uid), {
          email,
          role,
          createdAt: new Date().toISOString()
        });
        
        if (role === 'doctor') {
          window.location.hash = '#/doctor-dashboard';
        } else {
          window.location.hash = '#/onboarding';
        }
      }
    } catch (err) {
      showToast(err.message);
      submitBtn.disabled = false;
      submitBtn.style.opacity = '1';
    }
  });
}
