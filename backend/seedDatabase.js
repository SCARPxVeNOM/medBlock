/**
 * Seed Database with Hospital A and Hospital B
 * Run: node seedDatabase.js
 */

const { connectDatabase, mongoose } = require('./config/database');
const Organization = require('./models/Organization');

async function seedDatabase() {
    try {
        await connectDatabase();

        console.log('\n🌱 Seeding database...\n');

        // Clear existing organizations
        await Organization.deleteMany({});

        // Create Organization 1
        const org1 = new Organization({
            orgId: 'org1',
            name: 'Organization 1',
            type: 'hospital',
            email: 'admin@org1.com',
            status: 'active'
        });
        await org1.save();
        console.log('✓ Created org1');

        // Create Hospital 1
        const hospital1 = new Organization({
            orgId: 'hospital1',
            name: 'Hospital 1 - Medical Center',
            type: 'hospital',
            email: 'admin@hospital1.com',
            status: 'active'
        });
        await hospital1.save();
        console.log('✓ Created Hospital 1');

        // Create Hospital 2
        const hospital2 = new Organization({
            orgId: 'hospital2',
            name: 'Hospital 2 - Regional Clinic',
            type: 'hospital',
            email: 'admin@hospital2.com',
            status: 'active'
        });
        await hospital2.save();
        console.log('✓ Created Hospital 2');

        console.log('\n✅ Database seeded successfully!\n');
        console.log('Organizations created:');
        console.log('  - Organization 1 (org1)');
        console.log('  - Hospital 1 (hospital1)');
        console.log('  - Hospital 2 (hospital2)\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
}

seedDatabase();

