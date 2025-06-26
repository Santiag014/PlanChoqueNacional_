import React, { useEffect, useState } from 'react';
import { API_URL } from '../config';

export default function Register() {
  const [form, setForm] = useState({
    name: '', email: '', documento: '', password: '',
    rol_id: '', zona_id: '', regional_id: '', agente_id: ''
  });
  const [roles, setRoles] = useState([]);
  const [zonas, setZonas] = useState([]);
  const [regionales, setRegionales] = useState([]);
  const [agentes, setAgentes] = useState([]);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('Cargando selects, API_URL:', API_URL);

    console.log('Fetch roles:', `${API_URL}/api/roles`);
    fetch(`${API_URL}/api/roles`)
      .then(r => r.json())
      .then(d => {
        setRoles(d.data || []);
        console.log('roles', d.data);
      })
      .catch(err => {
        setRoles([]);
        console.error('Error roles', err);
      });

    console.log('Fetch zonas:', `${API_URL}/api/zonas`);
    fetch(`${API_URL}/api/zonas`)
      .then(r => r.json())
      .then(d => {
        setZonas(d.data || []);
        console.log('zonas', d.data);
      })
      .catch(err => {
        setZonas([]);
        console.error('Error zonas', err);
      });

    console.log('Fetch regionales:', `${API_URL}/api/regionales`);
    fetch(`${API_URL}/api/regionales`)
      .then(r => r.json())
      .then(d => {
        setRegionales(d.data || []);
        console.log('regionales', d.data);
      })
      .catch(err => {
        setRegionales([]);
        console.error('Error regionales', err);
      });

    console.log('Fetch agentes:', `${API_URL}/api/agentes`);
    fetch(`${API_URL}/api/agentes`)
      .then(r => r.json())
      .then(d => {
        setAgentes(d.data || []);
        console.log('agentes', d.data);
      })
      .catch(err => {
        setAgentes([]);
        console.error('Error agentes', err);
      });
  }, []);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMsg(''); setError('');
    const res = await fetch(`${API_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    if (data.success) setMsg('¡Usuario registrado!');
    else setError(data.message || 'Error');
  };

  return (
    <div style={{
      maxWidth: 420,
      margin: '40px auto',
      background: '#fff',
      padding: 32,
      borderRadius: 18,
      boxShadow: '0 4px 24px #e3061322',
      fontFamily: 'Segoe UI, Arial, sans-serif'
    }}>
      <h2 style={{
        color: '#e30613',
        fontWeight: 900,
        textAlign: 'center',
        marginBottom: 18,
        letterSpacing: 1
      }}>Registro de Usuario</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <input
          name="name"
          placeholder="Nombre completo"
          value={form.name}
          onChange={handleChange}
          required
          style={{
            border: '1.5px solid #e30613',
            borderRadius: 8,
            padding: '12px 14px',
            fontSize: 15,
            outline: 'none',
            marginBottom: 0
          }}
        />
        <input
          name="email"
          placeholder="Correo electrónico"
          value={form.email}
          onChange={handleChange}
          required
          type="email"
          style={{
            border: '1.5px solid #e30613',
            borderRadius: 8,
            padding: '12px 14px',
            fontSize: 15,
            outline: 'none',
            marginBottom: 0
          }}
        />
        <input
          name="documento"
          placeholder="Documento"
          value={form.documento}
          onChange={handleChange}
          required
          type="number"
          style={{
            border: '1.5px solid #e30613',
            borderRadius: 8,
            padding: '12px 14px',
            fontSize: 15,
            outline: 'none',
            marginBottom: 0
          }}
        />
        <input
          name="password"
          placeholder="Contraseña"
          value={form.password}
          onChange={handleChange}
          required
          type="password"
          autoComplete="new-password"
          style={{
            border: '1.5px solid #e30613',
            borderRadius: 8,
            padding: '12px 14px',
            fontSize: 15,
            outline: 'none',
            marginBottom: 0
          }}
        />
        <select
          name="rol_id"
          value={form.rol_id}
          onChange={handleChange}
          required
          style={{
            border: '1.5px solid #e30613',
            borderRadius: 8,
            padding: '12px 14px',
            fontSize: 15,
            background: '#fff',
            color: form.rol_id ? '#222' : '#888',
            marginBottom: 0
          }}
        >
          <option value="">Seleccione Rol</option>
          {roles.map(r => <option key={r.id} value={String(r.id)}>{r.descripcion}</option>)}
        </select>
        <select
          name="zona_id"
          value={form.zona_id}
          onChange={handleChange}
          required
          style={{
            border: '1.5px solid #e30613',
            borderRadius: 8,
            padding: '12px 14px',
            fontSize: 15,
            background: '#fff',
            color: form.zona_id ? '#222' : '#888',
            marginBottom: 0
          }}
        >
          <option value="">Seleccione Zona</option>
          {zonas.map(z => <option key={z.id} value={String(z.id)}>{z.descripcion}</option>)}
        </select>
        <select
          name="regional_id"
          value={form.regional_id}
          onChange={handleChange}
          required
          style={{
            border: '1.5px solid #e30613',
            borderRadius: 8,
            padding: '12px 14px',
            fontSize: 15,
            background: '#fff',
            color: form.regional_id ? '#222' : '#888',
            marginBottom: 0
          }}
        >
          <option value="">Seleccione Regional</option>
          {regionales.map(r => <option key={r.id} value={String(r.id)}>{r.descripcion}</option>)}
        </select>
        <select
          name="agente_id"
          value={form.agente_id}
          onChange={handleChange}
          required
          style={{
            border: '1.5px solid #e30613',
            borderRadius: 8,
            padding: '12px 14px',
            fontSize: 15,
            background: '#fff',
            color: form.agente_id ? '#222' : '#888',
            marginBottom: 0
          }}
        >
          <option value="">Seleccione Agente</option>
          {agentes.map(a => <option key={a.id} value={String(a.id)}>{a.descripcion}</option>)}
        </select>
        <button
          type="submit"
          style={{
            width: '100%',
            margin: '12px 0 0 0',
            padding: '12px 0',
            background: 'linear-gradient(90deg, #e30613 60%, #ffa751 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 17,
            letterSpacing: 1,
            boxShadow: '0 2px 8px #e3061322',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
        >
          Registrar
        </button>
      </form>
      {msg && <div style={{
        color: '#1bb934',
        marginTop: 14,
        fontWeight: 700,
        textAlign: 'center',
        fontSize: 15
      }}>{msg}</div>}
      {error && <div style={{
        color: '#e30613',
        marginTop: 14,
        fontWeight: 700,
        textAlign: 'center',
        fontSize: 15
      }}>{error}</div>}
    </div>
  );
}
