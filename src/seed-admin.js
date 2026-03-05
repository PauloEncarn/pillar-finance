const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
// Se você usa bcrypt para salvar senhas, importe-o. 
// Se não, vamos salvar puro apenas para você entrar e depois você troca.
const bcrypt = require('bcryptjs'); 

async function main() {
  const hashedPassword = await bcrypt.hash('sua_senha_aqui', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'PAULO ENCARNACAO',
      email: 'seu-email@exemplo.com',
      password: hashedPassword,
      role: 'ADMIN',
      approved: true, // Já nasce aprovado para você entrar
    },
  });

  console.log('>>> Usuário ADMIN criado com sucesso:', admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });