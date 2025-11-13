import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

async function main() {
  const [, , emailArg, passwordArg] = process.argv;
  if (!emailArg || !passwordArg) {
    console.error("Verwendung: npm run admin:create -- <email> <passwort>");
    process.exit(1);
  }
  const email = emailArg.toLowerCase();
  const passwordHash = await bcrypt.hash(passwordArg, 10);

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      passwordHash,
      role: "ADMIN",
      name: "Admin",
    },
    update: {
      passwordHash,
      role: "ADMIN",
    },
  });

  console.log(`Admin bereit: ${user.email}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


