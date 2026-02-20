import jotform from '@wojtekmaj/jotform';
import { writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path'
import equipmentTemplate from '../utilities/equipmentTemplate.mjs'
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import express from 'express'
const router = express.Router()

router.get('/equipment', async (req, res) => {
  console.log('Hello world')
  const forms = await jotform.getForms({ limit:60 });
  const equipForms = forms.find(forms => forms.title == 'Equipment')
  const submissions = await jotform.getFormSubmissions(equipForms.id, { limit: 1000 })
  const equipmentArray = submissions.map(item => {
    return Object.values(item.answers)
      .filter(f => {
        return (
          f.name === 'device' ||
          f.name === 'assetNumber' ||
          f.name === 'serviceDate'
        )
      })
  })

  let outputBuilder = []

  equipmentArray.forEach(subArray => {
    let equipObj = {}
    subArray.forEach(obj => {
      if(obj.name == 'device') {
        equipObj['deviceName'] = obj.answer
      }
      if(obj.name == 'assetNumber') {
        equipObj['assetNumber'] = obj.answer
      }
      if(obj.name == 'serviceDate') {
        equipObj['serviceDate'] = obj.answer
      }
    })
    outputBuilder.push(equipObj)
  })

  console.log(outputBuilder)

  const filePath = path.join(__dirname, "equipment.json");

  try {
    await writeFile(
      filePath,
      JSON.stringify({ LIST: [equipmentTemplate, ...outputBuilder] }, null, 2),
      "utf8"
    );

    return res.sendFile(filePath, (err) => {
      if (err) {
        console.log("Could not send the file:", err);
        return res.status(500).send("Could not send the file");
      }
      console.log("File successfully sent...");
    });

  } catch (err) {
    console.log("Something went very wrong....", err);
    return res.status(500).send("Failed to write file");
  }

})

export default router