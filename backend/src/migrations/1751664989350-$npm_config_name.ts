import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1751664989350 implements MigrationInterface {
    name = 'InitialSchema1751664989350'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "category" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "color" character varying NOT NULL, "icon" character varying NOT NULL, CONSTRAINT "PK_9c4e4a89e3674fc9f382d733f03" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "expenses" ("id" SERIAL NOT NULL, "label" character varying NOT NULL, "amount" numeric(10,2) NOT NULL, "type" character varying NOT NULL DEFAULT 'expense', "date" TIMESTAMP NOT NULL, "userId" integer, "categoryId" integer, CONSTRAINT "PK_94c3ceb17e3140abc9282c20610" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "reset_token" ("id" SERIAL NOT NULL, "token" character varying NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "userId" integer, CONSTRAINT "PK_93e1171b4a87d2d0478295f1a99" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user" ("id" SERIAL NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "refreshToken" character varying, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "method" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "type" character varying NOT NULL, "userId" integer, CONSTRAINT "PK_0397aa041d83d4b429f53555861" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "budget" ("id" SERIAL NOT NULL, "income" double precision NOT NULL, "needBudget" double precision NOT NULL, "wantBudget" double precision NOT NULL, "savingBudget" double precision NOT NULL, "userId" integer, CONSTRAINT "PK_def6b33cb9809fb4b8ac44c69ae" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "expenses" ADD CONSTRAINT "FK_3d211de716f0f14ea7a8a4b1f2c" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "expenses" ADD CONSTRAINT "FK_ac0801a1760c5f9ce43c03bacd0" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reset_token" ADD CONSTRAINT "FK_1d61419c157e5325204cbee7a28" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "method" ADD CONSTRAINT "FK_b2ee5cdda42f4428a43707b1586" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "method" DROP CONSTRAINT "FK_b2ee5cdda42f4428a43707b1586"`);
        await queryRunner.query(`ALTER TABLE "reset_token" DROP CONSTRAINT "FK_1d61419c157e5325204cbee7a28"`);
        await queryRunner.query(`ALTER TABLE "expenses" DROP CONSTRAINT "FK_ac0801a1760c5f9ce43c03bacd0"`);
        await queryRunner.query(`ALTER TABLE "expenses" DROP CONSTRAINT "FK_3d211de716f0f14ea7a8a4b1f2c"`);
        await queryRunner.query(`DROP TABLE "method"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TABLE "reset_token"`);
        await queryRunner.query(`DROP TABLE "expenses"`);
        await queryRunner.query(`DROP TABLE "category"`);
    }

}
