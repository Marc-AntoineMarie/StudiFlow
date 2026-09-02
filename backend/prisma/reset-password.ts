/**
 * Réinitialise le mot de passe du compte unique. Aucune dépendance mail : cohérent
 * avec la décision de cadrage d'écarter le magic link (docs/01-note-de-cadrage.md).
 * Mono-utilisateur : ce script est le mécanisme de récupération, à exécuter par
 * quelqu'un qui a accès au serveur (le client via une commande documentée, ou
 * un repreneur du projet), pas par un flux "mot de passe oublié" en self-service.
 *
 * Usage (dans le conteneur) :
 *   docker compose exec backend npm run reset-password -- "nouveauMotDePasse123"
 * Usage (en local, sans Docker) :
 *   cd backend && npx ts-node prisma/reset-password.ts "nouveauMotDePasse123"
 */
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const nouveauMotDePasse = process.argv[2];
  if (!nouveauMotDePasse || nouveauMotDePasse.length < 8) {
    console.error('Usage : reset-password "<nouveau-mot-de-passe>" (8 caractères minimum)');
    process.exit(1);
  }

  const email = process.env.SEED_USER_EMAIL ?? 'demo@cadre.local';
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`Aucun utilisateur avec l'email ${email}. Vérifiez la variable SEED_USER_EMAIL.`);
    process.exit(1);
  }

  const passwordHash = await argon2.hash(nouveauMotDePasse);
  await prisma.user.update({ where: { email }, data: { passwordHash } });
  console.log(`Mot de passe réinitialisé pour ${email}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
