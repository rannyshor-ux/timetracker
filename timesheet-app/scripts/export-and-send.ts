import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [, , prodUrl, importSecret] = process.argv;

  if (!prodUrl || !importSecret) {
    console.error("Usage: tsx scripts/export-and-send.ts <PROD_URL> <IMPORT_SECRET>");
    console.error("Example: tsx scripts/export-and-send.ts https://timesheet.1to25.co.il mysecret123");
    process.exit(1);
  }

  console.log("Reading local database...");
  const employees = await prisma.employee.findMany();
  const projects = await prisma.project.findMany();
  const phases = await prisma.phase.findMany();
  const timeEntries = await prisma.timeEntry.findMany();

  console.log(`Found: ${employees.length} employees, ${projects.length} projects, ${phases.length} phases, ${timeEntries.length} time entries`);
  console.log(`Sending to ${prodUrl}...`);

  const res = await fetch(`${prodUrl}/api/admin/import-db`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-import-secret": importSecret,
    },
    body: JSON.stringify({ employees, projects, phases, timeEntries }),
  });

  const result = await res.json();

  if (res.ok) {
    console.log("✓ Import successful!", result.imported);
  } else {
    console.error("✗ Import failed:", result);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
