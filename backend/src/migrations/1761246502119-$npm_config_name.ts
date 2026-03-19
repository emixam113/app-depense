import { MigrationInterface, QueryRunner } from "typeorm";

export class  $npmConfigName1761246502119 implements MigrationInterface {
    name = ' $npmConfigName1761246502119'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "category" DROP CONSTRAINT "fk_category_user"`);
        await queryRunner.query(`ALTER TABLE "reset_token" RENAME COLUMN "token" TO "code"`);
        await queryRunner.query(`ALTER TABLE "category" DROP COLUMN "user_id"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "category" ADD "user_id" integer`);
        await queryRunner.query(`ALTER TABLE "reset_token" RENAME COLUMN "code" TO "token"`);
        await queryRunner.query(`ALTER TABLE "category" ADD CONSTRAINT "fk_category_user" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
