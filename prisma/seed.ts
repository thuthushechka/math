import bcrypt from "bcryptjs";
import { createPrismaClient } from "../src/lib/prisma-client";

const prisma = createPrismaClient();

async function main() {
  const adminHash = await bcrypt.hash("admin", 10);
  const parentHash = await bcrypt.hash("math14", 10);

  await prisma.settings.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      pricePerLesson: 1200,
      maxTaskNumber: 20,
      adminLogin: "admin",
      adminPasswordHash: adminHash,
      parentLogin: "math",
      parentPasswordHash: parentHash,
    },
    update: {},
  });

  console.log("Seed completed: admin/admin, parent math/math4..math7, price=1200, maxTask=20");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
