import { useState, useEffect } from 'react';

/**
 * Hook personalizado para obtener el enlace de PowerBI del usuario autenticado
 * Obtiene el enlace tanto desde los datos del usuario como desde el token JWT
 */
export const usePowerBI = () => {
  const [powerbiLink, setPowerbiLink] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getPowerBILink = () => {
      console.log("🚀 INICIANDO usePowerBI Hook");
      
      try {
        setLoading(true);
        setError(null);

        // Primero intentar obtener el link desde el usuario almacenado
        const storedUser = localStorage.getItem("user");
        console.log("🔍 Raw storedUser:", storedUser);
        
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          console.log("📊 Datos completos del usuario:", JSON.stringify(userData, null, 2));
          console.log("🎯 Tipo de usuario:", userData.tipo);
          console.log("🎯 Email del usuario:", userData.email);
          
          // Buscar el campo del PowerBI en el objeto user
          const link = userData.powerBI || userData.power_bi || userData.powerbi || "";
          console.log("🔗 Link encontrado:", link);
          console.log("🔗 userData.powerBI:", userData.powerBI);
          console.log("🔗 userData.power_bi:", userData.power_bi);
          console.log("🔗 userData.powerbi:", userData.powerbi);
          
          if (link) {
            console.log("✅ Link de PowerBI encontrado en user:", link);
            setPowerbiLink(link);
            setLoading(false);
            return;
          } else {
            console.log("❌ No se encontró link en datos de usuario, intentando con token...");
          }
        } else {
          console.log("❌ No hay datos de usuario en localStorage");
        }
        
        // Si no se encuentra en user, intentar desde el token JWT
        const token = localStorage.getItem("authToken") || localStorage.getItem("token");
        console.log("🎫 Token encontrado:", token ? "Sí" : "No");
        console.log("🎫 Token raw:", token);
        
        if (!token || token === 'legacy_auth') {
          console.log("⚠️ No hay token válido en localStorage");
          setLoading(false);
          return;
        }
        
        try {
          // Decodificar el payload del JWT
          const payload = JSON.parse(atob(token.split('.')[1]));
          console.log("📋 Payload completo del token:", JSON.stringify(payload, null, 2));
          
          // Buscar el campo del PowerBI en el token
          const link = payload.powerBI || payload.powerbiLink || payload.powerbi_link || payload.link_powerbi || payload.linkPowerBI || "";
          console.log("🔗 Link en token:", link);
          console.log("🔗 payload.powerBI:", payload.powerBI);
          console.log("🔗 payload.powerbiLink:", payload.powerbiLink);
          
          if (link) {
            console.log("✅ Link de PowerBI encontrado en token:", link);
            setPowerbiLink(link);
          } else {
            console.log("❌ No se encontró enlace de PowerBI");
          }
        } catch (tokenError) {
          console.error("❌ Error decodificando token:", tokenError);
        }
        
      } catch (error) {
        console.error("❌ Error al obtener link de PowerBI:", error);
        setError(error.message);
      } finally {
        console.log("🏁 FINALIZANDO usePowerBI Hook");
        console.log("🔗 Link final establecido:", powerbiLink);
        setLoading(false);
      }
    };

    console.log("🔄 Ejecutando getPowerBILink...");
    getPowerBILink();
  }, []);

  return { powerbiLink, loading, error };
};
