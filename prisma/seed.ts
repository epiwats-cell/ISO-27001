import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const controls = [
  { code: "A.5", name: "Information Security Policies", nameTh: "นโยบายความมั่นคงปลอดภัยสารสนเทศ", description: "กำหนดนโยบายและวัตถุประสงค์ด้านความมั่นคงปลอดภัยสารสนเทศขององค์กร", order: 1 },
  { code: "A.6", name: "Organization of Information Security", nameTh: "การจัดองค์กรด้านความมั่นคงปลอดภัยสารสนเทศ", description: "กำหนดโครงสร้างองค์กรและความรับผิดชอบด้านความมั่นคงปลอดภัย", order: 2 },
  { code: "A.7", name: "Human Resource Security", nameTh: "ความมั่นคงปลอดภัยด้านทรัพยากรบุคคล", description: "การคัดกรองพนักงาน การฝึกอบรม และการสิ้นสุดการจ้างงาน", order: 3 },
  { code: "A.8", name: "Asset Management", nameTh: "การจัดการทรัพย์สิน", description: "การระบุ จำแนกประเภท และป้องกันทรัพย์สินสารสนเทศ", order: 4 },
  { code: "A.9", name: "Access Control", nameTh: "การควบคุมการเข้าถึง", description: "การจัดการสิทธิ์การเข้าถึงระบบและข้อมูล", order: 5 },
  { code: "A.10", name: "Cryptography", nameTh: "การเข้ารหัสข้อมูล", description: "การใช้งานการเข้ารหัสเพื่อปกป้องข้อมูล", order: 6 },
  { code: "A.11", name: "Physical and Environmental Security", nameTh: "ความมั่นคงปลอดภัยทางกายภาพและสภาพแวดล้อม", description: "การป้องกันพื้นที่และอุปกรณ์ทางกายภาพ", order: 7 },
  { code: "A.12", name: "Operations Security", nameTh: "ความมั่นคงปลอดภัยในการดำเนินงาน", description: "การจัดการการดำเนินงานด้านเทคโนโลยีสารสนเทศ", order: 8 },
  { code: "A.13", name: "Communications Security", nameTh: "ความมั่นคงปลอดภัยในการสื่อสาร", description: "การปกป้องเครือข่ายและการสื่อสารข้อมูล", order: 9 },
  { code: "A.14", name: "System Acquisition, Development and Maintenance", nameTh: "การได้มา พัฒนา และบำรุงรักษาระบบสารสนเทศ", description: "การรักษาความมั่นคงปลอดภัยในวงจรการพัฒนาระบบ", order: 10 },
  { code: "A.15", name: "Supplier Relationships", nameTh: "ความสัมพันธ์กับผู้ส่งมอบ", description: "การจัดการความมั่นคงปลอดภัยในความสัมพันธ์กับผู้ขายและผู้ให้บริการ", order: 11 },
  { code: "A.16", name: "Information Security Incident Management", nameTh: "การจัดการเหตุการณ์ด้านความมั่นคงปลอดภัยสารสนเทศ", description: "การตอบสนองและการจัดการเหตุการณ์ความมั่นคงปลอดภัย", order: 12 },
  { code: "A.17", name: "Information Security Aspects of Business Continuity Management", nameTh: "ความต่อเนื่องทางธุรกิจด้านความมั่นคงปลอดภัยสารสนเทศ", description: "การวางแผนและรักษาความต่อเนื่องทางธุรกิจ", order: 13 },
  { code: "A.18", name: "Compliance", nameTh: "การปฏิบัติตามกฎหมาย ระเบียบ และข้อกำหนด", description: "การปฏิบัติตามข้อกำหนดทางกฎหมายและข้อบังคับต่างๆ", order: 14 },
];

async function main() {
  console.log("Seeding database...");

  // Create ISO controls
  for (const control of controls) {
    await prisma.iSOControl.upsert({
      where: { code: control.code },
      update: {},
      create: control,
    });
  }
  console.log("✓ ISO 27001 controls created");

  // Create admin user
  const adminPassword = await bcrypt.hash("Admin@123456", 10);
  await prisma.user.upsert({
    where: { email: "admin@company.com" },
    update: {},
    create: {
      email: "admin@company.com",
      name: "ผู้ดูแลระบบ",
      password: adminPassword,
      role: "admin",
      department: "IT Security",
    },
  });
  console.log("✓ Admin user created: admin@company.com / Admin@123456");

  // Create regular user
  const userPassword = await bcrypt.hash("User@123456", 10);
  await prisma.user.upsert({
    where: { email: "user@company.com" },
    update: {},
    create: {
      email: "user@company.com",
      name: "ผู้ใช้งานทั่วไป",
      password: userPassword,
      role: "user",
      department: "IT Department",
    },
  });
  console.log("✓ Regular user created: user@company.com / User@123456");

  console.log("✓ Database seeded successfully!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
