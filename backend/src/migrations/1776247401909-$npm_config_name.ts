import { MigrationInterface, QueryRunner } from "typeorm";

export class  $npmConfigName1776247401909 implements MigrationInterface {
    name = ' $npmConfigName1776247401909'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "expenses" ADD "isRecurring" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "expenses" DROP COLUMN "isRecurring"`);
    }

}
