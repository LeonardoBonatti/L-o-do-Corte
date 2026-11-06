/* ============================================================
   Gera o ADMIN_PASSWORD_HASH para colar nas variáveis da Vercel.

   Uso:  node scripts/hash-password.mjs
         (digite a senha quando pedir)

   Ou:   echo "minha-senha" | node scripts/hash-password.mjs

   A senha não é gravada em lugar nenhum: só o hash aparece na saída.
   Cole o HASH na Vercel, nunca a senha.
   ============================================================ */

import crypto from 'node:crypto';
import readline from 'node:readline';

const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };

function hash(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16);
    crypto.scrypt(password, salt, SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p }, (err, derived) => {
      if (err) return reject(err);
      resolve(['scrypt', SCRYPT.N, SCRYPT.r, SCRYPT.p, salt.toString('base64'), derived.toString('base64')].join('$'));
    });
  });
}

function readPassword() {
  if (!process.stdin.isTTY) {
    return new Promise((resolve) => {
      let data = '';
      process.stdin.on('data', (c) => { data += c; });
      process.stdin.on('end', () => resolve(data.trim()));
    });
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question('Senha do barbeiro (vai aparecer na tela): ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

const password = await readPassword();

if (password.length < 8) {
  console.error('\nSenha curta demais. Use ao menos 8 caracteres — essa agora protege o painel de verdade.');
  process.exit(1);
}

console.log('\nADMIN_PASSWORD_HASH=' + (await hash(password)));
console.log('\nCole essa linha nas variáveis de ambiente da Vercel (Production e Preview).');
console.log('Depois limpe o terminal, porque a senha ficou visível no histórico da tela.');
