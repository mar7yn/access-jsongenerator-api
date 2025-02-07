import jotform from '@wojtekmaj/jotform';
import { writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path'
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import express from 'express'
const router = express.Router()

router.get('/hospitals', async (req, res) => {
  const forms = await jotform.getForms({ limit:60 });
  const medsForm = forms.find(form => form.title == 'UK Critical Care Database');
  const submissions = await jotform.getFormSubmissions(medsForm.id, { limit:1000 });

  const hospitalsSubmissionsArray = submissions.map(hospital => {

    const howManyEntry = Object.values(hospital.answers).find(f => f.name === 'howMany')
    const howManyValue = howManyEntry ? howManyEntry.answer : '0'
    const howMany = parseInt(howManyValue, 10);
    
    return Object.values(hospital.answers)
      .filter(f => {
        if (f.name === 'howMany' || 
          f.name === 'trust' || 
          f.name === 'hospital' || 
          f.name === 'reportingSector' || 
          f.name === 'postCode' || 
          f.name === 'switchboardNumber' || 
          f.name === 'specialistPathways') {
        return true;
      }

        // Dynamically check for 'icuNameUnit' based on 'howMany'
        if (f.name.startsWith('icuNameUnit')) {
          // Extract the number after 'icuNameUnit' (e.g., 'icuNameUnit1' => 1)
          const unitIndex = parseInt(f.name.replace('icuNameUnit', ''), 10); 

          // Include this ICU unit if its number is less than or equal to 'howMany'
          return unitIndex > 0 && unitIndex <= howMany;
        }

        return false
      })
  })

  let outputBuilder = []
  console.log(hospitalsSubmissionsArray)

  hospitalsSubmissionsArray.forEach(subArray => {
    let hospObj = {}
    let units = []
    let ccu1 = {}
    let ccu2 = {}
    
    subArray.forEach(obj => {
      if (obj.name == 'trust') {
        hospObj['trust'] = obj.answer
      }
      if (obj.name == 'hospital') {
        hospObj['hospital'] = obj.answer
      }
      if (obj.name == 'reportingSector') {
        hospObj['reportingSector'] = obj.answer
      }
      if (obj.name == 'postCode') {
        hospObj['postCode'] = obj.answer
      }
      if (obj.name == 'switchboardNumber') {
        hospObj['switchboardNumber'] = obj.answer
      }
      if (obj.name == 'specialistPathways') {
        hospObj['specialistPathways'] = obj.answer
      }

      //////////////
      //////////////



      /**
       * icuNameUnit
       * icuDirectNumberUnit
       */
      
    })
    
    //hospObj['units'] = [ccu1, ccu2]
    outputBuilder.push(hospObj)
  })

  const filePath = path.join(__dirname, 'hospitals.json')

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

  /**
   * trust
   * hospital
   * typeOf
   * reportingSector
   * postCode
   * switchboardNumber
   * howTo
   * pleaseDescribe
   * ifThe52
   * reportingNhs
   * floorCoordinatorcritical
   * auditNurse53
   * specialistPathways
   * describePrealert
   * describePrealert31
   * describePrealert32
   * describePrealert33
   * describePrealert34
   * describePrealert35
   * describePrealert36
   * howMany
   * 
   * nameOf
   * criticalCare17
   * criticalCare48
   * consultantDirect
   * nurseIn
   * registrarDirect
   * satNav
   * descriptionOf
   * bestEntrance
   * otherUseful
   * 
   * nameOf56
   * criticalCare57
   * criticalCare58
   * consultantDirect59
   * nurseIn60
   * registrarDirect61
   * satNav62
   * descriptionOf63
   * bestEntrance64
   * otherUseful65
   */

  /**
   * New ICU Fields
   * icuNameUnit
   * icuDirectNumberUnit
   * icuDirectMobileNumberUnit
   * icuConsultantUnit
   * icuNicUnit
   * icuRegUnit
   * icuSatNavUnit
   * icuLocDescUnit
   * icuBestEntranceUnit
   * icuOtherInfoUnit
   */
})

export default router