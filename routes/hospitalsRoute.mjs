import jotform from '@wojtekmaj/jotform';
import { writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path'
import hospitalTemplate from '../utilities/template.mjs'
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import express from 'express'
const router = express.Router()

router.get('/hospitals', async (req, res) => {
  const forms = await jotform.getForms({ limit:60 });
  const medsForm = forms.find(form => form.title == 'UK Critical Care Database');
  const submissions = await jotform.getFormSubmissions(medsForm.id, { limit:1000 });

  const hospitalsSubmissionsArray = submissions.map(hospital => {
    const howManyEntry = Object.values(hospital.answers).find(f => f.name === 'howMany');
    const howMany = parseInt(howManyEntry?.answer || '0', 10);
  
    const formattedHospital = {};
    const units = [];
  
    // Process each answer in the object
    Object.values(hospital.answers).forEach(f => {
      if (
        f.name === 'trust' || 
        f.name === 'hospital' || 
        f.name === 'reportingSector' || 
        f.name === 'geographicalSector' ||
        f.name === 'postCode' || 
        f.name === 'switchboardNumber' || 
        f.name === 'specialistPathways' ||
        f.name === 'howToContact' ||
        f.name === 'howToContactDescr' ||
        f.name === 'reportingNhs' ||
        f.name === 'floorCoordinatorcritical' ||
        f.name === 'auditNurse53' ||
        f.name === 'describePrealertCardiac' ||
        f.name === 'describePrealertNeuro' ||
        f.name === 'describePrealertTrauma' ||
        f.name === 'describePrealertBurns' ||
        f.name === 'describePrealertRenal' ||
        f.name === 'describePrealertIR' ||
        f.name === 'describePrealertOther'

      ) {
        // Add fixed fields to the hospital object
        formattedHospital[f.name] = f.answer;
      }
    });
  
    // Dynamically generate ICU-related fields based on howMany
    const icuFields = Object.values(hospital.answers).filter(f =>
      f.name.startsWith('icuNameUnit') || 
      f.name.startsWith('icuDirectNumberUnit') || 
      f.name.startsWith('icuDirectMobileNumberUnit') ||
      f.name.startsWith('icuConsultantUnit') ||
      f.name.startsWith('icuNicUnit') ||
      f.name.startsWith('icuRegUnit') ||
      f.name.startsWith('icuSatNavUnit') ||
      f.name.startsWith('icuLocDescUnit') ||
      f.name.startsWith('icuBestEntranceUnit') ||
      f.name.startsWith('icuOtherInfoUnit')
    );

      // Group ICU fields by their unit number, up to 'howMany'
    const icuFieldGroups = {};
    icuFields.forEach(field => {
      const match = field.name.match(/(icuNameUnit|icuDirectNumberUnit|icuDirectMobileNumberUnit|icuConsultantUnit|icuNicUnit|icuRegUnit|icuSatNavUnit|icuLocDescUnit|icuBestEntranceUnit|icuOtherInfoUnit)(\d+)/);
      if (match) {
        const [_, fieldType, unitNumber] = match;
        const unitNumberInt = parseInt(unitNumber, 10);

        if (unitNumberInt > 0 && unitNumberInt <= howMany) {
          if (!icuFieldGroups[unitNumber]) {
            icuFieldGroups[unitNumber] = {};
          }
          icuFieldGroups[unitNumber][fieldType] = field.answer;
        }
      }
    });

      // Build ICU units array from grouped fields
    Object.keys(icuFieldGroups).forEach(unitNumber => {
      const group = icuFieldGroups[unitNumber];
      const icuUnit = {}

      if (group['icuNameUnit']) {
        icuUnit.icuName = group['icuNameUnit'];
      }
      if (group['icuDirectNumberUnit']) {
        icuUnit.icuDirectNumber = group['icuDirectNumberUnit'];
      }
      if (group['icuDirectMobileNumberUnit']) {
        icuUnit.icuDirectMobileNumber = group['icuDirectMobileNumberUnit'];
      }
      if (group['icuConsultantUnit']) {
        icuUnit.icuConsultant = group['icuConsultantUnit']
      }
      if (group['icuNicUnit']) {
        icuUnit.icuNic = group['icuNicUnit']
      }
      if (group['icuRegUnit']) {
        icuUnit.icuRegUnit = group['icuRegUnit']
      }
      if (group['icuSatNavUnit']) {
        icuUnit.icuSatNav = group['icuSatNavUnit']
      }
      if (group['icuLocDescUnit']) {
        icuUnit.icuLocDesc = group['icuLocDescUnit']
      }
      if (group['icuBestEntranceUnit']) {
        icuUnit.icuBestEntrance = group['icuBestEntranceUnit']
      }
      if (group['icuOtherInfoUnit']) {
        icuUnit.icuOtherInfoUnit = group['icuOtherInfoUnit']
      }
  
      // Include the ICU unit if it has any non-empty fields
      if (Object.keys(icuUnit).length > 0) {
        units.push(icuUnit);
      }
    });
  
    // Add ICU units array to the formatted hospital object
    formattedHospital.units = units;
  
    return formattedHospital;
  });

  const filePath = path.join(__dirname, 'hospitals.json')

  await writeFile(filePath, JSON.stringify({ "LIST" : [hospitalTemplate, ...hospitalsSubmissionsArray] }), (err) => {
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