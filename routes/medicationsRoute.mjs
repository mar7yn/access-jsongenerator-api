import jotform from '@wojtekmaj/jotform';
import { writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path'
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import express from 'express'
const router = express.Router()

router.get('/medications', async (req, res) => {
  const drugType = req.query.type
  
  const forms = await jotform.getForms({ limit:60 });
  const medsForm = forms.find(form => form.title == 'Medications');
  const submissions = await jotform.getFormSubmissions(medsForm.id, { limit:1000 });
  const infusionSubmissionsArray = submissions.map(drug => {
    return Object.values(drug.answers)
      .filter(f => {
        return (
          f.name === 'drugName' || 
          f.name === 'units' ||
          f.name === 'drugnameunit' ||
          f.name === 'rate' || 
          f.name === 'route' || 
          f.name === 'medicationType16' || 
          f.name === 'standardConcentration' ||
          f.name === 'standardDilution' ||
          f.name === 'fluidRestricted' ||
          f.name === 'choiceOf' ||
          f.name === 'controlledDrug' ||
          f.name === 'otherInformation'
        )
      })
  })
  
  let outputBuilder = []
  
  infusionSubmissionsArray.forEach(subArray => {
    let infObj = {}
    subArray.forEach(obj => {
      if (obj.name == 'drugName') {
        infObj['drugName'] = obj.answer
      } if (obj.name == 'units') {
        infObj['units'] = obj.answer
      } if (obj.name == 'drugnameunit') {
        infObj['drugnameunit'] = obj.answer
      } if (obj.name == 'rate') {
        infObj['rate'] = obj.answer
      } if (obj.name == 'route') {
        infObj['route'] = obj.answer
      } if (obj.name == 'medicationType16') {
        infObj['medicationType16'] = obj.answer
      } if (obj.name == 'medicationType16') {
        infObj['medicationTypeStr'] = obj.prettyFormat
      } if (obj.name == 'standardConcentration') {
        infObj['standardConcentration'] = obj.answer
      } if (obj.name == 'standardDilution') {
        infObj['standardDilution'] = obj.answer
      } if (obj.name == 'fluidRestricted') {
        infObj['fluidRestricted'] = obj.answer
      } if (obj.name == 'choiceOf') {
        infObj['choiceOf'] = obj.answer
      } if (obj.name == 'controlledDrug') {
        infObj['controlledDrug'] = obj.answer
      } if (obj.name == 'otherInformation') {
        infObj['otherInformation'] = obj.answer
      }
    })

    if (drugType == 'cds' && infObj.controlledDrug == 'Yes') {
      outputBuilder.push(infObj)
    } else if (drugType == 'Bolus' && infObj.medicationType16.includes('Bolus')) {
      outputBuilder.push(infObj)
    } else if (drugType == 'Infusion' && infObj.medicationType16.includes('Infusion')) {
      outputBuilder.push(infObj)
    }
  })

  const filePath = path.join(__dirname, `${drugType}.json`)

  await writeFile(filePath, JSON.stringify({ "LIST" : outputBuilder }), (err) => {
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