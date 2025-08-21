import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

// Script para probar la plantilla de implementaciones
const templatePath = path.join(process.cwd(), 'config', 'Plantilla_Implementaciones.xlsx');

console.log('🧪 Probando la plantilla de implementaciones...');
console.log('📂 Ruta de plantilla:', templatePath);
console.log('📁 Archivo existe:', fs.existsSync(templatePath));

try {
  // Intentar leer la plantilla con configuración mínima que funcione
  console.log('🔍 Intentando lectura con estilos básicos...');
  let workbook = XLSX.readFile(templatePath, {
    cellStyles: true,
    bookSheets: true
  });
  
  console.log('✅ Plantilla cargada exitosamente');
  console.log('📃 Número de hojas:', workbook.SheetNames ? workbook.SheetNames.length : 0);
  console.log('📝 Nombres de hojas:', workbook.SheetNames);
  console.log('🏗️ Estructura workbook.Sheets:', workbook.Sheets ? 'Presente' : 'Ausente');

  if (workbook.Sheets && workbook.SheetNames && workbook.SheetNames.length > 0) {
    const sheetName = workbook.SheetNames[0];
    console.log('🎯 Probando acceso a la primera hoja:', sheetName);
    
    const worksheet = workbook.Sheets[sheetName];
    if (worksheet) {
      console.log('✅ Hoja accesible exitosamente');
      console.log('📏 Rango de la hoja:', worksheet['!ref']);
      
      // Probar algunas celdas específicas
      const testCells = ['A1', 'B1', 'A4', 'B5'];
      testCells.forEach(cell => {
        if (worksheet[cell]) {
          console.log(`📊 Celda ${cell}:`, worksheet[cell].v);
        } else {
          console.log(`⚪ Celda ${cell}: vacía`);
        }
      });
    } else {
      console.error('❌ No se pudo acceder a la hoja:', sheetName);
    }
  } else {
    console.error('❌ No hay hojas disponibles en la plantilla o estructura inválida');
    
    // Intentar con opciones diferentes
    console.log('🔄 Intentando con opciones diferentes...');
    workbook = XLSX.readFile(templatePath, { bookSheets: true });
    console.log('📃 Hojas con bookSheets:', workbook.SheetNames);
    console.log('🏗️ Estructura Sheets:', workbook.Sheets ? 'Presente' : 'Ausente');
  }

} catch (error) {
  console.error('❌ Error cargando la plantilla:', error.message);
  console.error('🔍 Stack trace:', error.stack);
}
