import jotform from '@wojtekmaj/jotform';
import { writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path'
import consultantDrugTemplate from '../utilities/consultantDrugTemplate.mjs'
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import express from 'express'
const router = express.Router()

router.get('/consultant-list', async (req, res) => {
  const forms = await jotform.getForms({ limit:60 });
  const medsForm = forms.find(form => form.title == 'Medications');
  const submissions = await jotform.getFormSubmissions(medsForm.id, { limit:1000 });

  const consultantDrugListSubmissionsArray = submissions.map(drug => {
    return Object.values(drug.answers)
      .filter(f => f.name == 'drugName' || f.name == 'units' || f.name === 'medicationType16')
  })

  let outputBuilder = []

  consultantDrugListSubmissionsArray.forEach(subArray => {
    let infObj = {}
    subArray.forEach(obj => {
      if (obj.name == 'drugName') {
        infObj['drugName'] = obj.answer
      } if (obj.name == 'units') {
        infObj['units'] = obj.answer
      } if (obj.name == 'medicationType16') {
        infObj['medicationType'] = obj.answer
      }
    })

    if (infObj.medicationType.includes('Infusion')) {
      delete infObj['medicationType']
      outputBuilder.push(infObj)
    }

  })

  const uniqueMeds = [];
  const seen = new Set();

  for (const med of outputBuilder) {
    if (!seen.has(med.drugName)) {
      seen.add(med.drugName);
      uniqueMeds.push(med);
    }
  }

  const filePath = path.join(__dirname, `consultantDrugList.json`)

  await writeFile(filePath, JSON.stringify({ "LIST" : [consultantDrugTemplate, ...uniqueMeds] }), (err) => {
    if (err) {
      console.log("Error writing file: ", err)
      return
    }
    console.log("File successfully written")
  }).then(response => {
    res.sendFile(filePath, (err) => {
      if (err) {
        return res.status(500).send("Could not send the file: ", err.message)
      } else {
        console.log("File successfully sent...")
        return res.status(200).end()
      }
    })
  }).catch(err => {
    console.log('Something went wrong...', err)
  })
  
})

export default router