import jotform from '@wojtekmaj/jotform';
import { writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import express from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

const pickAnswer = (answersObj, fieldName) =>
  Object.values(answersObj ?? {}).find(a => a?.name === fieldName)?.answer ?? null;

const normaliseOwner = (raw) => {
  if (raw == null) return "";                 // null/undefined -> ""
  const v = String(raw).trim().toUpperCase(); // normalise casing/spaces
  if (v === "ACCESS" || v === "LAS") return v;
  return "";                                  // anything else -> ""
};

router.get('/equipment', async (req, res) => {
  try {
    const forms = await jotform.getForms({ limit: 60 });
    const equipForm = forms.find(f => f.title === 'Equipment');

    if (!equipForm) {
      return res.status(404).json({ error: 'Equipment form not found' });
    }

    const submissions = await jotform.getFormSubmissions(equipForm.id, { limit: 1000 });

    const grouped = {};

    for (const sub of submissions) {
      const device = pickAnswer(sub.answers, 'device') ?? "";
      const name = pickAnswer(sub.answers, 'name') ?? "";
      const assetNo = pickAnswer(sub.answers, 'assetNumber') ?? "";
      const serviceDate = pickAnswer(sub.answers, 'serviceDate') ?? "";
      const owner = normaliseOwner(pickAnswer(sub.answers, 'owner'));

      const deviceKey = String(device || "Other").trim();

      const row = {
        Device: device || deviceKey,
        Name: name ?? "",
        Asset_no: assetNo ?? "",
        Service_date: serviceDate ?? "",
        Owner: owner
      };

      if (!grouped[deviceKey]) grouped[deviceKey] = [];
      grouped[deviceKey].push(row);
    }

    const payload = { Equipment: grouped };

    const filePath = path.join(__dirname, "equipment.json");
    await writeFile(filePath, JSON.stringify(payload, null, 2), "utf8");

    return res.sendFile(filePath, (err) => {
      if (err) {
        console.log("Could not send the file:", err);
        return res.status(500).send("Could not send the file");
      }
    });

  } catch (err) {
    console.error("Something went very wrong....", err);
    return res.status(500).send("Failed to write file");
  }
});

export default router;