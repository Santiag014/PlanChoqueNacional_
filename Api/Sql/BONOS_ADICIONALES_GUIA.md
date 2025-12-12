# 📋 Guía de Bonos Adicionales - Plan Choque Nacional Terpel

## 🎯 Resumen Ejecutivo

El sistema cuenta con **4 bonos adicionales** para reconocer el desempeño excepcional de los asesores:

- ✅ **PDV en Segunda y Tercera Fase**: ACTIVO (se calcula automáticamente)
- 💤 **Primeros en Actuar**: INACTIVO (comentado en código)
- 💤 **Campeón por Agente**: INACTIVO (comentado en código)
- 💤 **Ejecución Perfecta**: INACTIVO (comentado en código)

---

## 🏆 Bonos Disponibles

### 1️⃣ **PDV en Segunda y Tercera Fase de Implementación** ✅ ACTIVO

#### ¿Qué reconoce?
Premia a los asesores que logran que sus PDV (Puntos de Venta) completen la segunda Y tercera fase de implementación de productos Terpel.

#### ¿Cuándo se otorga?
- **Fecha de corte**: 25 de octubre de 2025
- El bono se calcula automáticamente después de esa fecha

#### ¿Cuántos puntos otorga?
- **1,000 puntos** si implementó las dos fases (2 y 3) en TODOS sus PDV asignados
- **Puntos proporcionales** si solo lo logró en algunos PDV (ejemplo: 5 de 10 PDV = 500 puntos)

#### ¿Cómo se calcula?
1. El sistema verifica cuántos PDV completaron AMBAS fases (2 y 3)
2. Divide 1,000 puntos entre el total de PDV asignados
3. Multiplica por la cantidad de PDV que sí completaron las dos fases

**Ejemplo práctico:**
- Juan tiene 8 PDV asignados
- 6 PDV completaron fase 2 y 3
- Cálculo: (1000 / 8) × 6 = **750 puntos**

---

### 2️⃣ **Primeros en Actuar** 💤 INACTIVO

#### ¿Qué reconoce?
Premia a los **primeros 10 asesores** más rápidos en lograr 100% de cobertura (implementar todos sus PDV).

#### ¿Cuándo se otorgaría?
- **Fecha límite**: 6 de septiembre de 2025
- Solo cuenta si lograron 100% ANTES de esa fecha
- Se premia por orden de completado (el primero en lograr 100%, luego el segundo, etc.)

#### ¿Cuántos puntos otorga?
- **2,000 puntos** a cada uno de los 10 primeros

#### ¿Cómo se calcularía?
1. El sistema revisa TODOS los asesores
2. Identifica quiénes lograron 100% de cobertura antes del 6 de septiembre
3. Los ordena por fecha de completado (del más rápido al más lento)
4. Asigna 2,000 puntos a los primeros 10

**Ejemplo práctico:**
- María completó 100% el 25 de agosto (puesto #3) → **2,000 puntos** ✅
- Carlos completó 100% el 10 de septiembre → No califica ❌ (muy tarde)
- Ana completó 100% el 5 de septiembre (puesto #12) → No califica ❌ (no está en top 10)

#### ¿Cómo activarlo?
1. Ir al archivo: `Api/routes/asesor.js`
2. Buscar: `// --- Lógica para "Primeros en Actuar"`
3. Eliminar los `//` al inicio de las líneas (descomentar el código)
4. Reiniciar el servidor API

---

### 3️⃣ **Campeón por Agente** 💤 INACTIVO

#### ¿Qué reconoce?
Premia al **mejor vendedor del mes** en cada zona comercial (agente).

#### ¿Cuándo se otorgaría?
- **Cada mes** desde agosto hasta diciembre 2025
- Se calcula al finalizar cada mes
- **Excepción**: Diciembre termina el 15 (no el 31)

#### ¿Cuántos puntos otorga?
- **1,000 puntos mensuales** al ganador de cada zona

#### ¿Cómo se calcularía?
1. El sistema agrupa asesores por agente/zona
2. Suma el volumen total (galones) vendidos por cada asesor en el mes
3. El asesor con MÁS galones en su zona gana 1,000 puntos
4. Se repite cada mes (agosto, septiembre, octubre, noviembre, diciembre)

**Ejemplo práctico - Zona Norte en Septiembre:**
- Pedro: 1,200 galones
- Luis: 950 galones  
- Ana: 1,450 galones → **¡GANA 1,000 PUNTOS!** 🏆

**Nota importante**: Es un bono MENSUAL, por lo que un asesor podría ganar hasta 5,000 puntos (1,000 × 5 meses) si es el mejor cada mes.

#### ¿Cómo activarlo?
1. Ir al archivo: `Api/routes/asesor.js`
2. Buscar: `// --- Lógica para "Campeón por Agente"`
3. Eliminar los `//` al inicio de TODAS las líneas del bloque
4. Reiniciar el servidor API
5. El sistema calculará automáticamente los meses pasados (agosto-diciembre)

---

### 4️⃣ **Ejecución Perfecta** 💤 INACTIVO

#### ¿Qué reconoce?
Premia la **excelencia total** al final de la campaña: 100% en cobertura Y 100% en frecuencia.

#### ¿Cuándo se otorgaría?
- **Fecha de evaluación**: 15 de diciembre de 2025 (fin de campaña)
- El bono se calcularía automáticamente después de esa fecha

#### ¿Cuántos puntos otorga?
- **1,000 puntos** si cumple AMBOS requisitos

#### ¿Cómo se calcularía?
El asesor debe cumplir **las dos condiciones**:

**Condición 1 - Cobertura al 100%:**
- Implementar TODOS sus PDV asignados
- Fecha límite: 20 de diciembre de 2025

**Condición 2 - Frecuencia al 100%:**
- Visitar cada PDV al menos 10 veces durante la campaña
- Sin límite de fecha (cuenta toda la campaña)

**Ejemplo práctico:**
Juan tiene 5 PDV asignados:

✅ **Cobertura**: Implementó los 5 PDV antes del 20 de diciembre  
✅ **Frecuencia**: Realizó 52 visitas totales (5 PDV × 10 visitas = 50 requeridas, tiene 52)  
**Resultado**: ¡GANA 1,000 PUNTOS! 🎉

María tiene 8 PDV asignados:

✅ **Cobertura**: Implementó los 8 PDV  
❌ **Frecuencia**: Solo realizó 65 visitas (necesitaba 80 = 8 PDV × 10)  
**Resultado**: No califica ❌

#### ¿Cómo activarlo?
1. Ir al archivo: `Api/routes/asesor.js`
2. Buscar: `// --- Lógica para "Ejecución Perfecta"`
3. Eliminar los `//` al inicio de TODAS las líneas del bloque
4. Reiniciar el servidor API
5. El sistema lo calculará automáticamente después del 15 de diciembre

---

## 📊 Tabla Comparativa

| Bono | Estado | Puntos | Requisito Principal | Fecha Clave |
|------|--------|--------|-------------------|-------------|
| **PDV Fase 2 y 3** | ✅ Activo | 1,000 | Completar fase 2 Y 3 en PDV | 25-Oct-2025 |
| **Primeros en Actuar** | 💤 Inactivo | 2,000 | Top 10 en velocidad (100% cobertura) | 06-Sep-2025 |
| **Campeón por Agente** | 💤 Inactivo | 1,000/mes | Más galones en tu zona cada mes | Mensual (Ago-Dic) |
| **Ejecución Perfecta** | 💤 Inactivo | 1,000 | 100% cobertura + 100% frecuencia | 15-Dic-2025 |

---

## 🔧 Instrucciones Técnicas para Activación

### Para Desarrolladores:

Los bonos comentados se pueden activar editando el archivo:  
📁 `Api/routes/asesor.js`

**Pasos generales:**
1. Buscar el bloque del bono deseado
2. Eliminar `//` al inicio de cada línea del bloque
3. Guardar el archivo
4. Reiniciar el servidor Node.js: `npm start` o `node server.js`

**⚠️ Advertencia**: 
- Los bonos "Primeros en Actuar" y "Campeón por Agente" calculan retroactivamente
- Al activarlos, se asignarán bonos para fechas pasadas si los asesores cumplieron los requisitos
- "Ejecución Perfecta" solo se calcula después del 15 de diciembre de 2025

---

## 📞 Contacto y Soporte

Para activar o desactivar bonos, contactar al equipo técnico de Bull Marketing SAS.

**Documento creado**: Diciembre 2025  
**Última actualización**: 12-Dic-2025
