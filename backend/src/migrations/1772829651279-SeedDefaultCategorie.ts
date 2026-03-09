import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedDefaultCategorie1772829651279 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // On insère les catégories par défaut dans la table "category"// Le userId est NULL car elles appartiennent au système, pas à un utilisateur précis
    await queryRunner.query(`
            INSERT INTO "category" ("name", "color", "isDefault", "userId", "createdAt", "updatedAt")
            VALUES 
                ('Alimentation', '#FF7043', true, NULL, NOW(), NOW()),
                ('Logement', '#4FC3F7', true, NULL, NOW(), NOW()),
                ('Transport', '#81C784', true, NULL, NOW(), NOW()),
                ('Divertissement', '#BA68C8', true, NULL, NOW(), NOW()),
                ('Santé', '#E57373', true, NULL, NOW(), NOW()),
                ('Éducation', '#FFD54F', true, NULL, NOW(), NOW()),
                ('Autres', '#90A4AE', true, NULL, NOW(), NOW())
            ON CONFLICT DO NOTHING;
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Si on annule la migration, on supprime les catégories par défaut
    await queryRunner.query(`DELETE FROM "category" WHERE "isDefault" = true`);
  }
}
