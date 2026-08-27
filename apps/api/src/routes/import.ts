import type { FastifyInstance } from "fastify";
import { players } from "@fantapicker/db";
import { isXlsx } from "@fantapicker/shared";
import { requireAuth } from "../plugins/auth.ts";
import { db } from "../db.ts";
import { parseQuotazioniXlsx, type ParseQuotazioniResult } from "../excel/parse-quotazioni.ts";

const CHUNK = 200;

export async function registerImportRoute(app: FastifyInstance) {
  app.post("/import", { preHandler: requireAuth }, async (request, reply) => {
    const file = await request.file();
    if (!file) {
      return reply.code(400).send({ error: "Manca il file del listone" });
    }
    if (!isXlsx(file.filename, file.mimetype)) {
      return reply.code(400).send({ error: "Carica un file .xlsx" });
    }

    const buffer = await file.toBuffer();
    let parsed: ParseQuotazioniResult | undefined;
    try {
      parsed = await parseQuotazioniXlsx(buffer);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "File Excel non valido";
      return reply.code(400).send({ error: message });
    }

    await db.transaction(async (tx) => {
      await tx.delete(players);
      for (let i = 0; i < parsed.players.length; i += CHUNK) {
        await tx.insert(players).values(parsed.players.slice(i, i + CHUNK));
      }
    });

    return {
      imported: parsed.players.length,
      skipped: parsed.skipped,
      headerRow: parsed.headerRow,
    };
  });
}
