import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Find all .prisma files in the given directory recursively.
 */
function findPrismaFiles(dir: string, results: string[] = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            if (file !== 'node_modules' && file !== 'client') {
                findPrismaFiles(fullPath, results);
            }
        } else if (file.endsWith('.prisma')) {
            results.push(fullPath);
        }
    }
    return results;
}

async function generate() {
    const prismaDir = path.join(process.cwd(), 'prisma');

    if (!fs.existsSync(prismaDir)) {
        console.error('Prisma directory not found');
        process.exit(1);
    }

    const schemaFiles = findPrismaFiles(prismaDir);
    console.log(`Found ${schemaFiles.length} Prisma schema(s)`);

    for (const schema of schemaFiles) {
        const relativePath = path.relative(process.cwd(), schema);
        console.log(`\nGenerating client for: ${relativePath}...`);
        try {
            execSync(`npx prisma generate --schema=${relativePath}`, { stdio: 'inherit' });
            console.log(`Successfully generated: ${relativePath}`);
        } catch (error) {
            console.error(`Failed to generate: ${relativePath}`);
            process.exit(1);
        }
    }

    console.log('\nAll Prisma clients generated successfully!');
}

generate();
