import React from 'react';
import DashboardLayout from '../../components/DashboardLayout';

export default function TyC() {
  const pStyle = { fontSize: 11, textAlign: 'justify', marginBottom: 12, color: '#444' };
  return (
    <DashboardLayout>
      <div style={{
        maxWidth: 700,
        margin: '0 auto',
        borderRadius: 16,
        padding: '0px 24px 32px 24px',
        color: '#444',
        fontSize: 15,
        lineHeight: 1.7,
        marginTop: 24,
        marginBottom: 24
      }}>
        <h1 style={{
          color: '#e30613',
          fontWeight: 900,
          fontSize: 22,
          marginBottom: 18,
          textAlign: 'center',
          letterSpacing: 1
        }}>
          TÉRMINOS Y CONDICIONES
        </h1>
        <h2 style={{ color: '#a1000b', fontWeight: 700, fontSize: 15, marginTop: 18 }}>1. Aceptación de los términos</h2>
        <p style={pStyle}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam euismod, urna eu tincidunt consectetur, nisi nisl aliquam enim, nec dictum nisi nisl eget sapien. Suspendisse potenti. Proin dictum, enim nec cursus dictum, urna erat dictum enim, nec dictum urna erat nec enim.
        </p>
        <h2 style={{ color: '#a1000b', fontWeight: 700, fontSize: 15, marginTop: 18 }}>2. Uso del sitio</h2>
        <p style={pStyle}>
          Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam. Sed nisi. Nulla quis sem at nibh elementum imperdiet.
        </p>
        <h2 style={{ color: '#a1000b', fontWeight: 700, fontSize: 15, marginTop: 18 }}>3. Propiedad intelectual</h2>
        <p style={pStyle}>
          Duis sagittis ipsum. Praesent mauris. Fusce nec tellus sed augue semper porta. Mauris massa. Vestibulum lacinia arcu eget nulla. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.
        </p>
        <h2 style={{ color: '#a1000b', fontWeight: 700, fontSize: 15, marginTop: 18 }}>4. Limitación de responsabilidad</h2>
        <p style={pStyle}>
          Curabitur sodales ligula in libero. Sed dignissim lacinia nunc. Curabitur tortor. Pellentesque nibh. Aenean quam. In scelerisque sem at dolor. Maecenas mattis. Sed convallis tristique sem.
        </p>
        <h2 style={{ color: '#a1000b', fontWeight: 700, fontSize: 15, marginTop: 18 }}>5. Modificaciones</h2>
        <p style={pStyle}>
          Nulla facilisi. Etiam faucibus cursus urna. Ut tellus. Nulla ut erat id mauris vulputate elementum. Nullam varius. Nulla facilisi. Etiam faucibus cursus urna.
        </p>
        <h2 style={{ color: '#a1000b', fontWeight: 700, fontSize: 15, marginTop: 18 }}>6. Contacto</h2>
        <p style={pStyle}>
          Si tienes preguntas sobre estos términos y condiciones, puedes contactarnos en <a href="mailto:info@terpel.com" style={{ color: '#e30613', textDecoration: 'underline' }}>info@terpel.com</a>.
        </p>
        <div style={{
          marginTop: 32,
          color: '#888',
          fontSize: 11,
          textAlign: 'center'
        }}>
          Última actualización: 2024-06-01
        </div>
      </div>
    </DashboardLayout>
  );
}
