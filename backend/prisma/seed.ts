/**
 * Seed minimal : garantit la présence de l'utilisateur unique et de la ligne Config.
 * Le jeu de données de démo (missions/documents/projets) est un seed séparé, à venir.
 */
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_USER_EMAIL ?? 'demo@cadre.local';
  const motDePasse = process.env.SEED_USER_PASSWORD ?? 'demo-cadre-2026';
  const passwordHash = await argon2.hash(motDePasse);

  const existant = await prisma.user.findUnique({ where: { email } });
  if (!existant) {
    await prisma.user.create({ data: { email, passwordHash } });
    console.log(`User créé : ${email}`);
  } else {
    console.log(`User déjà présent : ${email}`);
  }

  await prisma.config.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });
  console.log('Config id=1 assurée (valeurs par défaut : seuil 507, fenêtre 12, journée 8h, cachet 8h)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
