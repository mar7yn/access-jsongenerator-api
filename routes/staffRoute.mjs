import jotform from '@wojtekmaj/jotform';
import { writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path'
import staffTemplate from '../utilities/staffTemplate.mjs';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import express from 'express'
const router = express.Router()

router.get("/staff", async (req, res) => {
  const forms = await jotform.getForms({ limit:60 });
  const staffForm = forms.find(form => form.title == 'ACCESS Staff Database');
  const submissions = await jotform.getFormSubmissions(staffForm.id, { limit:1000 });
  
  const staffSubmissionsArray = submissions.map(person => {
    return Object.values(person.answers).filter(f =>  f.name === 'name' || f.name === 'nhsnetEmail' || f.name === 'jobRole' || f.name === 'nokName' || f.name === 'nokNumber' || f.name === 'activeAccess' || f.name === 'registrationNumber' || f.name === 'phoneNumber' || f.name === 'dateOf' || f.name === 'mask' || f.name === 'uploadYour')
  })

  let outputBuilder = []

  //TODO all staff members are built whether they are active or not. Should the active check be done first?
  console.log(staffSubmissionsArray)
  staffSubmissionsArray.forEach(subArray => {
    let personObj = {}
    subArray.forEach(obj => {
      if (obj.name == 'name') {
        personObj['name'] = obj.prettyFormat
      } if (obj.name == 'nhsnetEmail') {
        personObj['email'] = obj.answer
      } if (obj.name == 'jobRole') {
        personObj['jobRole'] = obj.prettyFormat
      } if (obj.name == 'nokName') {
        personObj['nokName'] = obj.answer
      } if (obj.name == 'nokNumber') {
        personObj['nokNumber'] = obj.answer
      } if (obj.name == 'registrationNumber') {
        personObj['registrationNumber'] = obj.answer
      } if (obj.name == 'activeAccess') {
        personObj['activeAccess'] = obj.answer
      } if (obj.name == 'phoneNumber') {
        personObj['phoneNumber'] = obj.answer
      } if (obj.name == 'dateOf') {
        personObj['dateOf'] = obj.answer
      } if (obj.name == 'mask') {
        personObj['mask'] = obj.answer
      } if (obj.name == 'uploadYour') {
        personObj['uploadYour'] = obj.answer
      }
    })
    outputBuilder.push(personObj)
  })


  const activeUsers = outputBuilder.filter(person => person.activeAccess === '1').map(person => {
    return {
      registrationNumber: person.registrationNumber,
      name: person.name,
      email: person.email,
      nokName: person.nokName,
      jobRole: person.jobRole,
      nokNumber: person.nokNumber,
      phoneNumber: person.phoneNumber,
      dateOf: person.dateOf,
      mask: person.mask,
      uploadYour: person.uploadYour 
    }
  })

    const filePath = path.join(__dirname, "staff.json")

  try {
    await writeFile(filePath, JSON.stringify({ "LIST": [staffTemplate, ...activeUsers] }))
    console.log("File successfully written")

    res.sendFile(filePath, (err) => {
      if (err) {
        console.log("Could not send the file:", err.message)
        return res.status(500).send("Could not send the file")
      }
      console.log("File successfully sent...")
    })
  } catch (err) {
    console.log('Something went wrong...', err)
    res.status(500).send("Something went wrong")
  }
})

export default router