import { MigrationInterface, QueryRunner } from "typeorm";

export class  $npmConfigName1776086030426 implements MigrationInterface {
    name = ' $npmConfigName1776086030426'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_1d61419c157e5325204cbee7a2"`);
        await queryRunner.query(`ALTER TABLE "method" DROP COLUMN "needPct"`);
        await queryRunner.query(`ALTER TABLE "method" DROP COLUMN "wantPct"`);
        await queryRunner.query(`ALTER TABLE "method" DROP COLUMN "savingPct"`);
        await queryRunner.query(`ALTER TABLE "reset_token" ADD "used" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "user" ADD "isPremium" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "isPremium"`);
        await queryRunner.query(`ALTER TABLE "reset_token" DROP COLUMN "used"`);
        await queryRunner.query(`ALTER TABLE "method" ADD "savingPct" double precision NOT NULL`);
        await queryRunner.query(`ALTER TABLE "method" ADD "wantPct" double precision NOT NULL`);
        await queryRunner.query(`ALTER TABLE "method" ADD "needPct" double precision NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_1d61419c157e5325204cbee7a2" ON "reset_token" ("userId") `);
    }

}
