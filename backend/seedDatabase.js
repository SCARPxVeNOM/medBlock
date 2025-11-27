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

        // Create Hospital A
        const hospitalA = new Organization({
            orgId: 'hospital-a',
            name: 'Hospital A - Medical Center',
            type: 'hospital',
            email: 'admin@hospitala.com',
            status: 'active'
        });
        await hospitalA.save();
        console.log('✓ Created Hospital A');

        // Create Hospital B
        const hospitalB = new Organization({
            orgId: 'hospital-b',
            name: 'Hospital B - Regional Clinic',
            type: 'hospital',
            email: 'admin@hospitalb.com',
            status: 'active'
        });
        await hospitalB.save();
        console.log('✓ Created Hospital B');

        // Also create org1 for backward compatibility
        const org1 = new Organization({
            orgId: 'org1',
            name: 'Organization 1',
            type: 'hospital',
            email: 'admin@org1.com',
            status: 'active'
        });
        await org1.save();
        console.log('✓ Created org1 (for compatibility)');

        console.log('\n✅ Database seeded successfully!\n');
        console.log('Organizations created:');
        console.log('  - Hospital A (hospital-a)');
        console.log('  - Hospital B (hospital-b)');
        console.log('  - Organization 1 (org1)\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
}

seedDatabase();

