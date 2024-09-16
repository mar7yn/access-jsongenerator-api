import jotform from '@wojtekmaj/jotform';
import express from 'express';
import cors from 'cors';
import 'dotenv/config'
import { writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path'
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors({ origin: [ "https://access-jsongenerator-1.onrender.com" ] }));

jotform.options({
  apiKey: process.env.JOTFORM_API,
  url: "https://eu-api.jotform.com"
})

/**
 * GET request for /api
 * Returns raw JSON from jotform
 */
app.get("/api", async (req, res) => {
  const forms = await jotform.getForms({ limit:60 });
  const staffForm = forms.find(form => form.title == 'ACCESS Staff Database');
  const submissions = await jotform.getFormSubmissions(staffForm.id, { limit:1000 });
  
  const staffSubmissionsArray = submissions.map(person => {
    return Object.values(person.answers).filter(f =>  f.name === 'name' || f.name === 'nhsEmail' || f.name === 'jobRole')
  })

  const output = staffSubmissionsArray.map(item => {
    return {
      name: item[0].prettyFormat,
      email: item[1].answer,
      jobRole: item[2].prettyFormat,
    }
  })

  const filePath = path.join(__dirname, "staff.json")

  await writeFile(filePath, JSON.stringify({ "LIST" : [...output] }), (err) => {
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

app.listen(3001, () => {
  console.log(`Server listening on port 3001... yay`)
})
