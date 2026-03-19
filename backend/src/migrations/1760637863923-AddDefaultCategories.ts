import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDefaultCategories1730000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log("🚀 Insertion des catégories par défaut...");
    await queryRunner.query(`
      INSERT INTO category ("name", "color", "isDefault", "userId", "createdAt", "updatedAt")
      VALUES
        ('Alimentation', '#FF7043', true, NULL, NOW(), NOW()),
        ('Logement', '#4FC3F7', true, NULL, NOW(), NOW()),
        ('Transport', '#81C784', true, NULL, NOW(), NOW()),
        ('Divertissement', '#BA68C8', true, NULL, NOW(), NOW()),
        ('Santé', '#E57373', true, NULL, NOW(), NOW()),
        ('Éducation', '#FFD54F', true, NULL, NOW(), NOW()),
        ('Autres', '#90A4AE', true, NULL, NOW(), NOW());
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM category WHERE "isDefault" = true;
    `);
  }
}
