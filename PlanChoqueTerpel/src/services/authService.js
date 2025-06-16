import { API_URL } from '../config';

// Simulación de autenticación
const users = [
  { user: 'admin', pass: '1234', name: 'Administrador' },
  { user: 'user', pass: 'abcd', name: 'Usuario Demo' }
];

export async function login(email, password) {
  try {
    const res = await fetch(`${API_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    return data;
  } catch (err) {
    return { success: false, message: 'Error de conexión con el servidor' };
  }
}
