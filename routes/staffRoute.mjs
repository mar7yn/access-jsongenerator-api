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
    return Object.values(person.answers).filter(f =>  f.name === 'name' || f.name === 'nhsEmail' || f.name === 'jobRole' || f.name === 'nokName' || f.name === 'nokNumber' || f.name === 'activeAccess' || f.name === 'registrationNumber' || f.name === 'phoneNumber')
  })

  let outputBuilder = []

  //TODO all staff members are built whether they are active or not. Should the active check be done first?

  staffSubmissionsArray.forEach(subArray => {
    let personObj = {}
    subArray.forEach(obj => {
      if (obj.name == 'name') {
        personObj['name'] = obj.prettyFormat
      } if (obj.name == 'nhsEmail') {
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
      } if (obj.name === 'registrationNumber') {
        personObj['registrationNumber'] = obj.answer
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
      phoneNumber: person.phoneNumber
    }
  })

  const filePath = path.join(__dirname, "staff.json")

  await writeFile(filePath, JSON.stringify({ "LIST" : [staffTemplate, ...activeUsers] }), (err) => {
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