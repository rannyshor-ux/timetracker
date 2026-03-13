import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_PHASES = [
  "תכנון ראשוני",
  "בקשה להיתר",
  "מסמכים למכרז",
  "מסמכים לביצוע",
  "פיקוח עליון",
];

async function main() {
  console.log("Seeding database...");

  // Create login users
  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const employeeUsername = process.env.EMPLOYEE_USERNAME || "employee";
  const employeePassword = process.env.EMPLOYEE_PASSWORD || "employee123";

  const existingAdmin = await prisma.user.findUnique({ where: { username: adminUsername } });
  if (!existingAdmin) {
    await prisma.user.create({
      data: { username: adminUsername, password: await bcrypt.hash(adminPassword, 10), role: "ADMIN" },
    });
    console.log(`  Created admin user: ${adminUsername}`);
  }

  const existingEmployee = await prisma.user.findUnique({ where: { username: employeeUsername } });
  if (!existingEmployee) {
    await prisma.user.create({
      data: { username: employeeUsername, password: await bcrypt.hash(employeePassword, 10), role: "EMPLOYEE" },
    });
    console.log(`  Created employee user: ${employeeUsername}`);
  }

  // Create employees
  const alice = await prisma.employee.upsert({
    where: { id: 1 },
    update: {},
    create: { name: "ישראל ישראלי", role: "אדריכל ראשי" },
  });

  const bob = await prisma.employee.upsert({
    where: { id: 2 },
    update: {},
    create: { name: "שרה כהן", role: "אדריכלית" },
  });

  const charlie = await prisma.employee.upsert({
    where: { id: 3 },
    update: {},
    create: { name: "דניאל לוי", role: "מתמחה" },
  });

  // Create project 1
  const project1 = await prisma.project.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: "וילה כרמל",
      client: "משפחת אברהמי",
      description: "בית פרטי, 350 מ״ר, כרמל",
      status: "active",
    },
  });

  // Create project 2
  const project2 = await prisma.project.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: "מרכז מסחרי תל אביב",
      client: "קבוצת השקעות ריאל",
      description: "מרכז מסחרי 2,000 מ״ר",
      status: "active",
    },
  });

  // Create project 3
  const project3 = await prisma.project.upsert({
    where: { id: 3 },
    update: {},
    create: {
      name: "שיפוץ משרדים ירושלים",
      client: "חברת הייטק בע״מ",
      description: "שיפוץ משרדים, 600 מ״ר",
      status: "completed",
    },
  });

  // Create phases for each project
  for (const project of [project1, project2, project3]) {
    for (let i = 0; i < DEFAULT_PHASES.length; i++) {
      await prisma.phase.upsert({
        where: { id: project.id * 10 + i + 1 },
        update: {},
        create: {
          id: project.id * 10 + i + 1,
          projectId: project.id,
          name: DEFAULT_PHASES[i],
          order: i + 1,
        },
      });
    }
  }

  // Fetch phases for time entries
  const p1phases = await prisma.phase.findMany({ where: { projectId: project1.id } });
  const p2phases = await prisma.phase.findMany({ where: { projectId: project2.id } });

  // Sample time entries
  const entries = [
    { employeeId: alice.id, phaseId: p1phases[0].id, date: new Date("2026-02-10"), hours: 3, description: "פגישה ראשונית עם הלקוח, סקר שטח" },
    { employeeId: alice.id, phaseId: p1phases[0].id, date: new Date("2026-02-12"), hours: 5, description: "שרטוט קונספט ראשוני" },
    { employeeId: bob.id, phaseId: p1phases[1].id, date: new Date("2026-02-18"), hours: 4, description: "הכנת מסמכי רישוי" },
    { employeeId: charlie.id, phaseId: p1phases[1].id, date: new Date("2026-02-20"), hours: 3, description: "עריכת תוכניות לרשויות" },
    { employeeId: alice.id, phaseId: p2phases[0].id, date: new Date("2026-02-14"), hours: 6, description: "תכנון ראשוני מרכז מסחרי" },
    { employeeId: bob.id, phaseId: p2phases[0].id, date: new Date("2026-02-15"), hours: 4, description: "מחקר שוק ודרישות תכנון" },
    { employeeId: alice.id, phaseId: p2phases[2].id, date: new Date("2026-03-01"), hours: 8, description: "תוכניות עבודה מפורטות" },
    { employeeId: charlie.id, phaseId: p2phases[2].id, date: new Date("2026-03-03"), hours: 5, description: "תוכניות חשמל ואינסטלציה" },
  ];

  for (const entry of entries) {
    await prisma.timeEntry.create({ data: entry });
  }

  console.log("✓ Seeding complete!");
  console.log(`  ${3} employees, ${3} projects, ${entries.length} time entries`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
