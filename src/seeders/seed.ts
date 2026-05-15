import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { RolesSeeder } from '../database/seeders/roles.seeder';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const logger = new Logger('Seeder');

  try {
    logger.log('Starting seeding process...');

    const rolesSeeder = app.get(RolesSeeder);
    await rolesSeeder.seed();

    logger.log('Seeding completed successfully.');
  } catch (error) {
    logger.error('Seeding failed!');
    console.error(error);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

bootstrap();
