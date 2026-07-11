import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedDefaultCategories1783585805701 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            INSERT INTO "category" ("name", "color", "isDefault", "createdAt", "updatedAt") VALUES 
            ('Alimentation', '#FF5733', true, now(), now()),
            ('Loyer', '#3498db', true, now(), now()),
            ('Transport', '#2ecc71', true, now(), now()),
            ('Loisirs', '#f1c40f', true, now(), now()),
            ('Santé', '#e74c3c', true, now(), now()),
            ('Éducation', '#9b59b6', true, now(), now()),
            ('Autre', '#95a5a6', true, now(), now());
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "category" WHERE "isDefault" = true`);
  }
}
