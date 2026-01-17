/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

if (!connectionString) {
    throw new Error('DATABASE_URL is required');
}

async function ensureAdminUser() {
    console.log('👤 Ensuring admin user exists...');

    const email = process.env.ADMIN_EMAIL || 'admin@example.com';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            password: hashedPassword,
            name: 'System Admin',
            role: 'ADMIN'
        },
        create: {
            email,
            name: 'System Admin',
            password: hashedPassword,
            role: 'ADMIN'
        }
    });

    console.log('✅ Admin user ready');
    console.log('   Email:', email);
    console.log('   Password:', password);
}

async function main() {
    console.log('🚀 Starting startup tasks...\n');

    try {
        await ensureAdminUser();

        console.log('\n✅ Startup tasks completed successfully!');
    } catch (error) {
        console.error('❌ Startup task failed:', error);
        throw error;
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
