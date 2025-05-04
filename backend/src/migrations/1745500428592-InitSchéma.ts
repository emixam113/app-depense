import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1745500428592 implements MigrationInterface {
name = 'InitSchema1745500428592'
public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "user" ("id" SERIAL NOT NULL, "lastname" character varying NOT NULL, "firstname" character varying NOT NULL, "birthdate" date NOT NULL, "email" character varying NOT NULL UNIQUE, "password" character varying NOT NULL, CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "category" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, CONSTRAINT "PK_9c4e4a89e3674fc9f382d733f03" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "expenses" ("id" SERIAL NOT NULL, "label" character varying NOT NULL, "amount" numeric(10,2) NOT NULL, "date" TIMESTAMP NOT NULL, "userId" integer, "categoryId" integer, CONSTRAINT "PK_94c3ceb17e3140abc9282c20610" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "method" ("id" SERIAL NOT NULL, "income" double precision NOT NULL, "needBudget" double precision NOT NULL, "wantBudget" double precision NOT NULL, "savingBudget" double precision NOT NULL, "userId" integer, CONSTRAINT "PK_def6b33cb9809fb4b8ac44c69ae" PRIMARY KEY ("id"))`);
    await queryRunner.query(`ALTER TABLE "expenses" ADD CONSTRAINT "FK_3d211de716f0f14ea7a8a4b1f2c" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "expenses" ADD CONSTRAINT "FK_ac0801a1760c5f9ce43c03bacd0" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "method" ADD CONSTRAINT "FK_b2ee5cdda42f4428a43707b1586" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
}

public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "method" DROP CONSTRAINT "FK_b2ee5cdda42f4428a43707b1586"`);
    await queryRunner.query(`ALTER TABLE "expenses" DROP CONSTRAINT "FK_ac0801a1760c5f9ce43c03bacd0"`);
    await queryRunner.query(`ALTER TABLE "expenses" DROP CONSTRAINT "FK_3d211de716f0f14ea7a8a4b1f2c"`);
    await queryRunner.query(`DROP TABLE "method"`);
    await queryRunner.query(`DROP TABLE "expenses"`);
    await queryRunner.query(`DROP TABLE "category"`);
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`DROP TABLE "message"`);
}
}