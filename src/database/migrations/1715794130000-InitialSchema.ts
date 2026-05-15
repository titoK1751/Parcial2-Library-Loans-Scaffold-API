/* eslint-disable prettier/prettier */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1715794130000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create item_type enum
    await queryRunner.query(`
      CREATE TYPE public.item_type_enum AS ENUM ('book', 'magazine', 'equipment')
    `);

    // Create items table
    await queryRunner.query(`
      CREATE TABLE public.items (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        code character varying(32) NOT NULL,
        title character varying(255) NOT NULL,
        type public.item_type_enum NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ba5885359424c15ca6b9e79bcf6" PRIMARY KEY (id),
        CONSTRAINT "UQ_96d0968cc0ff4e441d37e6b3b33" UNIQUE (code)
      )
    `);

    // Create index on items.code
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_96d0968cc0ff4e441d37e6b3b33" ON public.items (code)
    `);

    // Create loan_status enum
    await queryRunner.query(`
      CREATE TYPE public.loan_status_enum AS ENUM ('active', 'returned', 'overdue', 'lost')
    `);

    // Create loan_priority enum
    await queryRunner.query(`
      CREATE TYPE public.loan_priority_enum AS ENUM ('normal', 'urgent')
    `);

    // Create loans table
    await queryRunner.query(`
      CREATE TABLE public.loans (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "itemId" uuid NOT NULL,
        "loanedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "dueAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "returnedAt" TIMESTAMP WITH TIME ZONE,
        status public.loan_status_enum NOT NULL DEFAULT 'active',
        "fineAmount" numeric(10,2) NOT NULL DEFAULT '0.00',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_2d01c463647e0a16ec7fcca8e27" PRIMARY KEY (id),
        CONSTRAINT "FK_user_loans" FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE RESTRICT,
        CONSTRAINT "FK_item_loans" FOREIGN KEY ("itemId") REFERENCES public.items(id) ON DELETE RESTRICT,
        CONSTRAINT "CHK_dueAt_greater_than_loanedAt" CHECK ("dueAt" > "loanedAt")
      )
    `);

    // Create composite index on (itemId, status)
    await queryRunner.query(`
      CREATE INDEX "IDX_loans_itemId_status" ON public.loans ("itemId", status)
    `);

    // Create composite index on (userId, status)
    await queryRunner.query(`
      CREATE INDEX "IDX_loans_userId_status" ON public.loans ("userId", status)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`
      DROP INDEX IF EXISTS public."IDX_loans_userId_status"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS public."IDX_loans_itemId_status"
    `);

    // Drop loans table
    await queryRunner.query(`
      DROP TABLE IF EXISTS public.loans
    `);

    // Drop enums
    await queryRunner.query(`
      DROP TYPE IF EXISTS public.loan_priority_enum
    `);

    await queryRunner.query(`
      DROP TYPE IF EXISTS public.loan_status_enum
    `);

    // Drop items table
    await queryRunner.query(`
      DROP TABLE IF EXISTS public.items
    `);

    await queryRunner.query(`
      DROP TYPE IF EXISTS public.item_type_enum
    `);
  }
}
