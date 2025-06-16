import bcrypt from 'bcrypt';

const passwordPlano = '1030557119';
let hash = '$2y$12$5x8kgOmVANsgK15i1IXcdO/bucnAqYLY1capFs18og07JyttBWZj6';

// Reemplazar $2y$ por $2a$ (compatibilidad con bcrypt)
if (hash.startsWith('$2y$')) {
  hash = hash.replace('$2y$', '$2a$');
}

bcrypt.compare(passwordPlano, hash).then(match => {
  console.log('¿Coincide?', match);
});
