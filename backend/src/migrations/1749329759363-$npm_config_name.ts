import { MigrationInterface, QueryRunner } from "typeorm";

export class  $npmConfigName1749329759363 implements MigrationInterface {
    name = ' $npmConfigName1749329759363'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "reset_token" ("id" SERIAL NOT NULL, "token" character varying NOT NULL, "used" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "expiresAt" TIMESTAMP NOT NULL, "userId" integer, CONSTRAINT "PK_93e1171b4a87d2d0478295f1a99" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "resetToken"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "resetTokenExpires"`);
        await queryRunner.query(`ALTER TABLE "reset_token" ADD CONSTRAINT "FK_1d61419c157e5325204cbee7a28" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reset_token" DROP CONSTRAINT "FK_1d61419c157e5325204cbee7a28"`);
        await queryRunner.query(`ALTER TABLE "user" ADD "resetTokenExpires" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "user" ADD "resetToken" character varying`);
        await queryRunner.query(`DROP TABLE "reset_token"`);
    }

}
