import axios from "axios";
import dotenv from "dotenv"
import { MongoClient, ObjectId } from 'mongodb';
import twilio from 'twilio';
dotenv.config();
const mongoUrl = process.env.MONGO_URL;


const api_key = process.env.APIKEY;

const uri = mongoUrl;
const dbName = 'DCB_Audio';
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
const db = client.db(dbName);



export const FetchCalls = async (req, res) => {
  try {
 
    const accountSid = process.env.TWILIO_ACCOUNT_SID;

    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const client = twilio(accountSid, authToken);
    console.log('Fetching and storing recordings...');
    const targetNumbers = [
      '+19803516616',
      '+19803516959',
      '+19803516969',
      '+19803516979'
    ];
    // // Check if allowedNumbers is an array before joining
    // const allowedNumbersString = Array.isArray(allowedNumbers) ? allowedNumbers.join(',') : '';
    // console.log(allowedNumbersString)
    // // Fetch calls to any of the allowed numbers
    // const callsto = await client.calls.list({
    //   to: allowedNumbersString,
    // });
    
    // // Fetch calls from any of the allowed numbers
    // const callsfrom = await client.calls.list({
    //   from: allowedNumbersString,
    // });
    
    // console.log(callsto);
    // console.log(callsfrom);
    


    // const calls = await client.calls.list();  
    const threeDaysAgo = new Date();
threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
console.log(threeDaysAgo)
const calls = await client.calls.list({
  startTimeAfter: threeDaysAgo.toISOString()
});

 
  const filteredCalls = calls.filter(call => {
    return targetNumbers.includes(call.to) || targetNumbers.includes(call.from);
  });
  console.log(filteredCalls)
    const callToMap = new Map();
    const callFroMMap = new Map();
    const oldcollection = db.collection('recordings_rows_two');
    for (let call of filteredCalls ) {
      // console.log( call.to,call.from)
      callToMap.set(call.sid, call.to);
      callFroMMap.set(call.sid, call.from)
      const existingRecording = await oldcollection.findOne({ call_sid: call.sid });
      if (!existingRecording) {
        // console.log(`Call SID: ${call.sid}, From: ${call.from}, To: ${call.to}, Status: ${call.status},${call}`);

        const callRecordings = await client.recordings.list({ callSid: call.sid });
        const to = callToMap.get(call.sid);
        const from = callFroMMap.get(call.sid);
        if (to) {
          callRecordings.forEach(recording => {
            recording.to = to;

          });
        }
        if (from) {
          callRecordings.forEach(recording => {

            recording.from = from;
          });
        }
        console.log('Call Recordings:', callRecordings);

        if (callRecordings.length > 0) {
          const serializedRecordings = callRecordings.map(recording => {
            return JSON.stringify({
              _id: recording.sid,
              _airbyte_unique_key: recording.sid,
              subresource_uris: recording.subresourceUris,
              date_updated: recording.dateUpdated,
              date_created: recording.dateCreated,
              source: recording.source,
              api_version: recording.apiVersion,
              uri: recording.uri,
              media_url: recording.mediaUrl,
              sid: recording.sid,
              duration: recording.duration,
              price_unit: recording.priceUnit,
              start_time: recording.startTime,
              channels: recording.channels,
              price: recording.price,
              call_sid: recording.callSid,
              account_sid: recording.accountSid,
              call_status: recording.status,
              to: recording.to,
              from: recording.from,
              _airbyte_ab_id: recording._airbyte_ab_id,
              _airbyte_emitted_at: recording._airbyte_emitted_at,
              _airbyte_normalized_at: recording._airbyte_normalized_at,
              _airbyte_recordings_hashid: recording._airbyte_recordings_hashid
            });
          });

          const result = await oldcollection.insertMany(serializedRecordings.map(serialized => JSON.parse(serialized)));
          // console.log(`${result.insertedCount} recordings inserted into MongoDB`);
        } else {
          console.log('No recordings found for this call.');
        }
      }
    }

    console.log('Recording fetching and storing complete.');
  } catch (error) {
    console.error('Error fetching and storing recordings:', error);
  }
}

export const Promtstatus = async (req, res) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;

  const authToken = process.env.TWILIO_AUTH_TOKEN;

  // Function to convert media URL
  function convertMediaUrl(mediaUrl) {
    if (!mediaUrl) {
      console.error('Media URL is undefined or null');
      return null;
    }
    return `https://${accountSid}:${authToken}@${mediaUrl.substring(8)}`;

  }

  console.log('Connected to MongoDB successfully');

  const db = client.db(dbName);
  const collection = db.collection("recordings_rows_two");

  try {
    // Fetch Twilio recordings from MongoDB
    // Iterate over each recording
    async function processRecording(recording, transcriptCollection) {
      try {
        // Check if transcript exists for the recording
        const transcript = await transcriptCollection.findOne({ call_sid: recording.sid });

        if (!transcript) {
          // let newtovalue = recording?.to;
          // let user_email=""

          // if(newtovalue=="+441494977140")
          //   {
          //     user_email == "info@chesshousedental.com"
          //   }
          //   else if (newtovalue=="+441174502991")
          //     {
          //       user_email == "michelle.frank@bristoldentalspecialists.com"
          //     }
          //    else if (newtovalue=="+442081598005"){
          //     user_email == "info@harrowwealddental.com"
          //    }
       
          
          console.log('Transcript not found for call SID:', recording.sid);
          const convertedMediaUrl = convertMediaUrl(recording.media_url);


          let call_status = 'answered';
          let new_patient_status = '--';
          let appointment_status = 'No';
          let appointment_status_text = '--';
          let action_required_text = '--';
          let action_required = 'No';
          let insights = '--';
          let new_patient = '--';
          let prompt_text = '';
          let services = '--';
          let receptionist = '--';
          let services_type = '--';
          console.log(convertedMediaUrl)
        
          
           let  call_sid= recording.sid;
          let audio_url= convertedMediaUrl;
          let from= recording.from;
          let  to= recording.to;
            let start_time= recording.start_time
        
            // console.log(audio_url)
            let body = {
              "audio_url": audio_url,
              "prompts": [
                "Provide a summary in under 100 characters",
                "Note any scheduled appointmentsCheck if any appointments were scheduled during the discussion; if so, note the date and time",
                "Higlight for what services the patient has called for (Example: Teeth cleaning services)",
                "Mention if the patient (or relevant person) discussed is a new or existing individual",
                "Determine if the interaction in a phone call is managed by a live human agent or a computer-generated voice. Additionally, identify specific phrases that indicate business hours or closures such as we are closed for lunch or we are closed today",
                "What is the name of the receptionist - The person who connects from the clinic.",
                "Based on the conversation find out which service category term is used like Invisalign: teeth straightening/crooked teeth/braces/aligners/aligning teeth",
                "Identify any action items suggested for doctors or the caller that is the patient"
              ]
            }
            const response = await axios.post(`https://prompt-llm.onrender.com/analyze-transcription`, body);
            const data_prompt = response.data;
        
            // if (!response_point_2.match(/1\) ([^.]+)|2\) ([^.]+)|3\) ([^.]+)|4\) ([^.]+)|5\) ([^.]+)|6\) ([^.]+)|7\) ([^.]+)|8\) ([^.]+)/)) {
            const live_call_keywords = ["caller reached", "phone call", "new and existing patients mentioned", "reason for call unclear", "unclear if new or existing patient"];
            const pre_recorded_keywords = ["phone menu provides options", "no appointments scheduled", "closed for lunch", "closed today", "reopening at", "Live human agent not indicated", 'voicemail'];
        
            let is_live_call = false;
            let is_pre_recorded_message = false;
        
            for (const keyword of live_call_keywords) {
             
              if (data_prompt.analyses[4].response.includes(keyword)) {
                is_live_call = true;
                break;
              }
            }
        
            for (const keyword of pre_recorded_keywords) {
              
              if (data_prompt.analyses[4].response.includes(keyword)) {
                is_pre_recorded_message = true;
                break;
              }
            }
        
            if (is_live_call) {
            
              call_status = 'hungup';
            } else if (is_pre_recorded_message) {
          
              call_status = 'voicemail';
            }
            // console.log(data_prompt.analyses[1].response)
        
            if (data_prompt.analyses[0].response) {
             
              insights = data_prompt.analyses[0].response.trim();
            }
            appointment_status_text = data_prompt.analyses[1].response.trim();
            if (appointment_status_text.includes("No appointment") || appointment_status_text.includes("no")) {
              
              appointment_status = 'No';
            } else {
            
              appointment_status = 'Yes';
            }
           console.log(start_time,call_sid,audio_url,data_prompt.analyses)
            // console.log(data_prompt)
        
            if (data_prompt.analyses[7].response) {
              
              action_required_text = data_prompt.analyses[7].response.trim();
              if (action_required_text.includes("No action") || action_required_text.includes("No") || action_required_text.includes("no clear action") || action_required_text.includes("no")) {
                
                action_required = 'No';
              } else {
                
                action_required = 'Yes';
              }
            }
            console.log(start_time)
            if (data_prompt.analyses[6].response) {
              
              services_type = data_prompt.analyses[6].response.trim();
            }
        
            if (data_prompt.analyses[3].response) {
              new_patient_status = data_prompt.analyses[3].response.includes("existing") || data_prompt.analyses[3].response.includes("Existing") ? 'Old' : 'New';
            }
            console.log(call_sid)
            if (data_prompt.analyses[5].response) {
             
              if (data_prompt.analyses[5].response.includes("No receptionist") || data_prompt.analyses[5].response.includes("not mentioned")
                || data_prompt.analyses[5].response.includes("not provided")||data_prompt.analyses[5].response.includes("no name")) {
             
                receptionist = "--"
              }
              else if (data_prompt.analyses[5].response.includes("the name of the receptionist is")) {
                
                const nameRegex = /the\s+name\s+of\s+the\s+receptionist\s+is\s+["']?([A-Za-z]+)["']?/i;
                const matches = data_prompt.analyses[5].response.match(nameRegex);
                if (matches && matches.length > 1) {
                 
                  const name = matches[1];
                  receptionist = name.charAt(0).toUpperCase() + name.slice(1);
                  
                }
              }
              
            }
            console.log("audio_url",audio_url)
            if (data_prompt.analyses[6].response) {
              if (data_prompt.analyses[6].response.includes("service category term used") || data_prompt.analyses[6].response.includes("service category term is")) {
                const splitResponse = data_prompt.analyses[6].response.includes("service category term used") ?
                                        data_prompt.analyses[6].response.split('service category term used') :
                                        data_prompt.analyses[6].response.split('service category term is');
                                        if (splitResponse.length > 1) {
                                          const term = splitResponse[1].match(/"([^"]+)"/);
                                          if (term) {
                                              services = term[1];
                                          }
                                      }
              }
                else if(data_prompt.analyses[6].response.includes("the term used for teeth straightening services is")){
                  const splitResponse = data_prompt.analyses[6].response.includes("the term used for teeth straightening services") ?
                  data_prompt.analyses[6].response.split('the term used for teeth straightening services') :
                  data_prompt.analyses[6].response.split('the term used for teeth straightening services is');
                  if (splitResponse.length > 1) {
                    const term = splitResponse[1].match(/"([^"]+)"/);
                    if (term) {
                        services = term[1];
                    }
                }
                  }
              // services = data_prompt.analyses[6].response.includes("service category term used is") || data_prompt.analyses[6].response.includes("service category term") ? data_prompt.analyses[6].response.split('term used')[1].trim() : '--';
              
            }
            console.log(services)

         

            const data_update = {
              date_created: start_time,
              call_sid: call_sid,
              local_record_path: audio_url,
              recordings: audio_url,
              transcription: '',
              transcript: '',
              appointment_status,
              action_required,
              insights,
              appointment_status_text,
              action_required_text,
              new_patient_status,
              new_patient,
              call_status,
              prompt_text: data_prompt.analyses,
              services_type: services_type,
              services,
              receptionist,
              from: from,
              trackingnumber: to
            };
        
            // const dataJson = JSON.stringify(data_update);
        
        
            const collection = db.collection('transcript_two');
        
            const result = await collection.insertOne(data_update);
           
            res.status(200).json({ "transcripe_data":data_prompt , "data": data_update })
        
            // return result;
          // } catch (error) {
            
          //   res.status(500).json({ "error": error });
          // }
        

          // const apiResponse = await axios.post(apiEndpoint, {

          //   call_sid: recording.sid,
          //   audio_url: convertedMediaUrl,
          //   from: recording.from,
          //   to: recording.to,
          //   start_time: recording.start_time

          // });

          // Assuming apiResponse.data contains the transcript data
          console.log('Transcript fetched for call SID:', recording.sid);
          return result;
        } else {
          console.log('Transcript already exists for call SID:', recording.sid);
          return null; // Return null as transcript already exists
        }
      } catch (error) {
        console.error('Error processing recording:', error.response ? error.response.data : error.message);
        return null;
      }
    }
    const twilioRecordings = await collection.find().toArray();
    const transcriptCollection = db.collection("transcript_two");
    // Iterate over each recording, process it, and update transcript if necessary
    for (const recording of twilioRecordings) {
      await processRecording(recording, transcriptCollection);

    }

    res.end("success")
  } catch (error) {
    console.error('Error fetching Twilio recordings from MongoDB:', error);
  }
}

//getting recordingurl for ecah callsid from recording rows and sending to Transcript controller
export const Promtstatustranscript = async (req, res) => {
 

  // API Endpoint
  const apiEndpoint = 'https://dcp-audiologyplus.onrender.com/wrapper/transcript';

  // Account SID and Auth Token
  const accountSid = process.env.TWILIO_ACCOUNT_SID;

  const authToken = process.env.TWILIO_AUTH_TOKEN;

  // Function to convert media URL
  function convertMediaUrl(mediaUrl) {
    if (!mediaUrl) {
      console.error('Media URL is undefined or null');
      return null;
    }
    return `https://${accountSid}:${authToken}@${mediaUrl.substring(8)}`;

  }

  console.log('Connected to MongoDB successfully');

  const db = client.db(dbName);
  const collection = db.collection("recordings_rows_two");
  const transcriptCollection = db.collection("transcript_two");
  try {
    // Fetch Twilio recordings from MongoDB
    // Iterate over each recording
    async function processRecording(recording) {
      try {
        // Check if transcript exists for the recording
        const transcript = await transcriptCollection.findOne({
          call_sid: recording.sid,
          transcription: ""
        });

         console.log(transcript)
        if (transcript) {
          console.log('Transcript not found for call SID:', recording.sid);
          const convertedMediaUrl = convertMediaUrl(recording.media_url);


          const apiResponse = await axios.get(apiEndpoint, {
            params: {
              call_sid: recording.sid,
              audioPath: convertedMediaUrl,
              from: recording.from,
              to: recording.to,
              start_time: recording.start_time
            }
          });

          // Assuming apiResponse.data contains the transcript data
          console.log('Transcript fetched for call SID:', recording.sid);
          return apiResponse.data;
        } else {
          console.log('Transcript already exists for call SID:', recording.sid);
          return null; // Return null as transcript already exists
        }
      } catch (error) {
        console.error('Error processing recording:', error.response ? error.response.data : error.message);
        return null;
      }
    }
    const twilioRecordings = await collection.find().toArray();

    // Iterate over each recording, process it, and update transcript if necessary
    for (const recording of twilioRecordings) {
      const transcriptData = await processRecording(recording);
      // if (transcriptData !== null) {

      //     await recordingsCollection.updateOne({ _id: recording._id }, { $set: { transcript: transcriptData } });
      // }
    }

    res.end("success")
  } catch (error) {
    console.error('Error fetching Twilio recordings from MongoDB:', error);
  }
}

//getting transcript from 3rd party
export const Transcript = async (req, res) => {
  try {
    const { call_sid, audioPath } = req.query;

    const assemblyAPIKey = process.env.ASSEMBLYAPIKEY;

    async function getTranscription(audio_url, recording) {
      try {
        const response = await axios.post('https://api.assemblyai.com/v2/transcript', {
          audio_url: audio_url,
          speaker_labels: true
        }, {
          headers: {
            'Authorization': `Bearer ${assemblyAPIKey}`,
            'Content-Type': 'application/json'
          }
        });

        const transcriptId = response.data.id;

        //  console.log(response.data)
        while (true) {
          const pollingResponse = await axios.get(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
            headers: {
              'Authorization': `Bearer ${assemblyAPIKey}`,
            }
          });

          const transcriptionResult = pollingResponse.data;
          // console.log(transcriptionResult)    
          if (transcriptionResult.status === "completed") {
            const transcriptionData = JSON.stringify(transcriptionResult);
            console.log(transcriptionData)
            await updateDatabase(recording, transcriptionData);
            res.status(200).json({ "transcripe_data": transcriptionData, "message": 'Document updated successfully!' });
            break;
          } else if (transcriptionResult.status === "error") {
            throw new Error(`Transcription failed: ${transcriptionResult.error}`);
          } else {
            await new Promise(resolve => setTimeout(resolve, 3000)); // wait for 3 seconds before polling again
          }
        }
      } catch (error) {
        console.error(error);
      }
    }

    async function updateDatabase(callSid, transcriptionData) {

      try {

        const collection = db.collection('transcript_two');

        const filter = { call_sid: callSid };
        const updateDoc = {
          $set: { transcription: transcriptionData }
        };

        await collection.updateOne(filter, updateDoc);
        // res.status(200).json({ "transcripe_data": transcriptionData, "message": 'Document updated successfully!' })
        console.log('Document updated successfully!');

      } catch (error) {
        console.error(error);
      }
    }

    // Example usage

    getTranscription(audioPath, call_sid);
  }
  catch (err) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
}

export const Recordingandprompt = async (req, res) => {
  try {
    // db.collection('recordings_rows').createIndex({ "to": 1 });
    const collection1 = db.collection('recordings_rows_two');
    // console.log(collection1)
    let service_type=req.query.service_type;
    let type=req.query.type;
    const user_email = req.query.user_email;
    let phone_number=req.query.phone_number
    const period = req.query.period;
    const currentDate = new Date();
    const startDate = new Date(currentDate);
    startDate.setDate(startDate.getDate() - parseInt(period || 0));

   
     let newtovalue=[];
    //  console.log(newtovalue)
    if(user_email&&!phone_number){
   
      // newtovalue = "+" + 19803516969
      newtovalue = ['+19803516616', '+19803516959', '+19803516969', '+19803516979'];
        if(type==="website"){
          newtovalue =['+7045943071']
        }
        else if(type==="campaign")
          {
            newtovalue = ['+19803516616', '+19803516959', '+19803516969', '+19803516979'];
            if(service_type){
              if(service_type==="hearing_test"){
                newtovalue=['+19803516616']
              }
              else if(service_type==="hearing_aids")
                {
                  newtovalue=['+19803516959']
                }
                else if(service_type==="hearing_aids_repair"){
                  newtovalue=['+19803516969']
                }
                else if(service_type==="tinnitus_evaluation"){
                  newtovalue=['+19803516979']
                }
            }
          }





      if(service_type){
        if(service_type==="hearing_test"){
          newtovalue=['+19803516616']
        }
        else if(service_type==="hearing_aids")
          {
            newtovalue=['+19803516959']
          }
          else if(service_type==="hearing_aids_repair"){
            newtovalue=['+19803516969']
          }
          else if(service_type==="tinnitus_evaluation"){
            newtovalue=['+19803516979']
          }
      }

    }else  if(phone_number&&!user_email){
      // newtovalue ="+" +phone_number;
      phone_number = phone_number.trim();
      newtovalue.push('+' + phone_number);

    }else if(phone_number&&user_email){
      phone_number = phone_number.trim();
      newtovalue.push('+' + phone_number);
    }
   
 
console.log("newtovalue",newtovalue)

// const initialResult = await collection1.aggregate([
//   {
//     $lookup: {
//       from: 'transcript_two',
//       localField: 'sid',
//       foreignField: 'call_sid',
//       as: 'joined_data'
//     }
//   },
//   {
//     $unwind: '$joined_data'
//   },
//   { $addFields: {
//     "start_date_new": { 
//       $dateToString: { format: "%Y-%m-%d", date: "$joined_data.date_updated" } 
//     },
//     "start_time_new": { 
//       $dateToString: { format: "%H:%M:%S", date: "$joined_data.date_updated" } 
//     }
//   }

// },
//   {
//     $project: {
//       "sid": 1,
//       "date_updated": 1,
//        "start_time_new": 1, // Include the date_updated field for debugging
//       "to": 1
//     }
//   },
//   {
//     $match: {
//       to: { $in: newtovalue }
//     }
//   }
// ]).toArray();

// Log the intermediate results to inspect date_updated values



const initialResult = await collection1.aggregate([
  {
    $lookup: {
      from: 'transcript_two',
      localField: 'sid',
      foreignField: 'call_sid',
      as: 'joined_data'
    }
  },
  {
    $unwind: '$joined_data'
  },
  {
    $addFields: {
      "start_date_new": { $dateToString: { format: "%Y-%m-%d", date: "date_updated" } },
      "start_time_new": { $dateToString: { format: "%H:%M:%S", date: "date_updated" } }
    }
  },
  {
    $project: {
      "sid": 1,
      "date_updated": 1,
      "to": 1,
      "start_date_new":1
    }
  }
]).toArray();

console.log(initialResult);


console.log(initialResult);

console.log("Intermediate Results:", initialResult);

    const result = await db.collection('recordings_rows_two').aggregate([
      {
        $lookup: {
          from: 'transcript_two',
          localField: 'sid',
          foreignField: 'call_sid',
          as: 'joined_data'
        }
      },
      {
        $unwind: '$joined_data'
      },
      {
        $addFields: {
          "start_date_new": { $dateToString: { format: "%Y-%m-%d", date: "$joined_data.date_updated" } },
          "start_time_new": { $dateToString: { format: "%H:%M:%S", date: "$joined_data.date_updated" } }
        }
      },
      {
        $project: {
          "_id": 0,
          "_airbyte_unique_key": "$_id",
          "subresource_uris": 1,
          "date_updated": 1,
          "date_created": 1,
          "source": 1,
          "api_version": 1,
          "uri": 1,
          "media_url": 1,
          "sid": 1,
          "duration": 1,
          "price_unit": 1,
          "start_time": 1,
          "channels": 1,
          "price": 1,
          "call_sid": 1,
          "account_sid": 1,
          // "call_status": 1,

          "to": 1,
          "from": 1,
          "transcribe": '$joined_data.transcribe',
          "appointment_status": '$joined_data.appointment_status',
          "action_required": '$joined_data.action_required',
          "insights": '$joined_data.insights',
          "appointment_status_text": '$joined_data.appointment_status_text',
          "action_required_text": '$joined_data.action_required_text',
          "new_patient_status": '$joined_data.new_patient_status',
          "new_patient": '$joined_data.new_patient',
          "prompt_text": '$joined_data.prompt_text',
          "services_type": '$joined_data.services_type',
          "services": '$joined_data.services',
          "receptionist": '$joined_data.receptionist',
          "call_status": '$joined_data.call_status',
          "start_date_new": 1,
          "start_time_new": 1
        }
      },
      {
        $match: {
          to: { $in: newtovalue }
        }
      },
      {
        $sort: { "start_time": -1 }
      }

    ]).toArray();
    // // Output the result
    // result.forEach(doc => {
    //     console.log(doc);
    // });
    // Output the result
    // const result = await db.collection('recordings_rows_two').find({}).toArray();
    // console.log(result.length);
    res.status(200).json({ "all_data": result })
  } catch (error) {
    console.error('Error:', error);
  }
}

export const Callhistorydata=async(req,res)=>{
  const user_email = req.query.user_email;
  let type=req.query.type
  let service_type=req.query.service_type;
  const phone_number= req.query.phone_number;
  const period = req.query.period;
  const start_date = req.query.start_date;
  const end_date = req.query.end_date;
  const currentDate = new Date();
  if (!start_date && !end_date) {
    const startDate = new Date(currentDate);
    startDate.setDate(startDate.getDate() - parseInt(period || 0));
    console.log(currentDate)
    console.log(startDate)
  }
  try {
let response1;
if(user_email&&!phone_number){
 
response1 = await axios.get(`https://dcp-audiologyplus.onrender.com/wrapper/recordingandprompt?user_email=${user_email}&service_type=${service_type}&type=${type}`);

}else if(phone_number&&!user_email){
  response1 = await axios.get(`https://dcp-audiologyplus.onrender.com/wrapper/recordingandprompt?phone_number=${phone_number}&service_type=${service_type}&type=${type}`);

} 
else if(phone_number&&user_email){
  response1 = await axios.get(`https://dcp-audiologyplus.onrender.com/wrapper/recordingandprompt?phone_number=${phone_number}&user_email=${user_email}&service_type=${service_type}&type=${type}`);
 }
    // console.log(response1.data);
    const recordingsData = response1.data.all_data;
    ;
    var days = parseInt(period);
    // Normalize the time component of currentDate
    currentDate.setHours(0, 0, 0, 0);
    var currentDay = currentDate.getDay();
    var startOfWeek = new Date(currentDate);
    var differenceToMonday = currentDay - 1;
    if (differenceToMonday < 0) differenceToMonday += 7;
    startOfWeek.setDate(currentDate.getDate() - differenceToMonday);
    let filteredData = [];
    if (start_date && end_date) {
      var startDateObj = new Date(start_date);
      var endDateObj = new Date(end_date);
      endDateObj.setHours(23, 59, 59, 999);
      filteredData = recordingsData.filter(function (item) {
        var itemStartDate = new Date(item.start_time);
        return itemStartDate >= startDateObj && itemStartDate <= endDateObj;
      })
    } else {
      filteredData = recordingsData.filter(function (item) {
        var itemDate = new Date(item.start_time);
        // Normalize the time component of itemDate
        itemDate.setHours(0, 0, 0, 0);
        var differenceInTime = currentDate.getTime() - itemDate.getTime();
        var differenceInDays = differenceInTime / (1000 * 3600 * 24);
        // Return true if the difference in days falls within the selected time period
        if (days === 0 && itemDate.getMonth() === currentDate.getMonth() && itemDate.getFullYear() === currentDate.getFullYear()) {
          return true;
        } else if (days === 7 && itemDate >= startOfWeek && itemDate <= currentDate) {
          return true;
        } else if (days === 30 && differenceInDays <= 30) {
          return true;
        } else if (days === 60 && differenceInDays <= 60) {
          return true;
        } else if (days === 90 && differenceInDays <= 90) {
          return true;
        }
        return false;
      });
    }
     
    res.status(200).json({"count":filteredData.length,"all_data":filteredData});
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
    console.log(err)
  }
}

//dashboardcount using useremail
export const DashboardCount = async (req, res) => {
  const user_email = req.query.user_email;
  let type=req.query.type
  let service_type=req.query.service_type;
  const phone_number=req.query.phone_number;
  const period = req.query.period;
  const start_date = req.query.start_date;
  const end_date = req.query.end_date;
  let flag=false;
  const currentDate = new Date();
  if (!start_date && !end_date) {
    const startDate = new Date(currentDate);
    startDate.setDate(startDate.getDate() - parseInt(period || 0));
    console.log(currentDate)
    console.log(startDate)
  }
  try {
    let response1;
    if(user_email&&!phone_number){
      flag=true
    response1 = await axios.get(`https://dcp-audiologyplus.onrender.com/wrapper/recordingandprompt?user_email=${user_email}&service_type=${service_type}&type=${type}`);

    }else if(phone_number&&!user_email){
      response1 = await axios.get(`https://dcp-audiologyplus.onrender.com/wrapper/recordingandprompt?phone_number=${phone_number}&service_type=${service_type}&type=${type}`);

    } 
    else if(phone_number&&user_email){
      response1 = await axios.get(`https://dcp-audiologyplus.onrender.com/wrapper/recordingandprompt?phone_number=${phone_number}&user_email=${user_email}&type=${service_type}&type=${type}`);
     }
       // console.log(response1.data);
    const recordingsData = response1.data.all_data;
    
    //  if(flag &&!type){
    
    //  }



    var days = parseInt(period);
    // Normalize the time component of currentDate
    currentDate.setHours(0, 0, 0, 0);
    var currentDay = currentDate.getDay();
    var startOfWeek = new Date(currentDate);
    var differenceToMonday = currentDay - 1;
    if (differenceToMonday < 0) differenceToMonday += 7;
    startOfWeek.setDate(currentDate.getDate() - differenceToMonday);
    let filteredData = [];
    if (start_date && end_date) {
      var startDateObj = new Date(start_date);
      var endDateObj = new Date(end_date);
      endDateObj.setHours(23, 59, 59, 999);
      filteredData = recordingsData.filter(function (item) {
        var itemStartDate = new Date(item.start_time);
        return itemStartDate >= startDateObj && itemStartDate <= endDateObj;
      })
    } else {
      filteredData = recordingsData.filter(function (item) {
        var itemDate = new Date(item.start_time);
        // Normalize the time component of itemDate
        itemDate.setHours(0, 0, 0, 0);
        var differenceInTime = currentDate.getTime() - itemDate.getTime();
        var differenceInDays = differenceInTime / (1000 * 3600 * 24);
        // Return true if the difference in days falls within the selected time period
        if (days === 0 && itemDate.getMonth() === currentDate.getMonth() && itemDate.getFullYear() === currentDate.getFullYear()) {
          return true;
        } else if (days === 7 && itemDate >= startOfWeek && itemDate <= currentDate) {
          return true;
        } else if (days === 30 && differenceInDays <= 30) {
          return true;
        } else if (days === 60 && differenceInDays <= 60) {
          return true;
        } else if (days === 90 && differenceInDays <= 90) {
          return true;
        }
        return false;
      });
    }
    
    const hearingTestNumber = '+19803516616';
    const hearingAidsNumber = '+19803516959';
    const hearingAidsRepairNumber = '+19803516969';
    const tinnitusEvaluationNumber = '+19803516979';
    let answeredCount = 0;
    let unansweredCount = 0;
    let headsUpCount = 0;
    let voiceCallCount = 0;
    let newPatientStatusCount = 0;
    let existingPatientStatusCount = 0;
    let appointmentStatusCount = 0;
    let actionRequiredCount = 0;
   

    let hearingTestCount = 0;
    let hearingAidsCount = 0;
   let hearingAidsRepairCount = 0;
   let tinnitusEvaluationCount = 0;



    filteredData.forEach(item => {
      
      if (item.call_status === 'answered') {
        answeredCount++;
      } else {
        if (item.call_status === 'heads up') {
          headsUpCount++;
        } else {
          voiceCallCount++;
        }
        unansweredCount++;
      }
      if (item.new_patient_status === 'New' || item.new_patient_status === 'new') {
        newPatientStatusCount++;
      } else if (item.new_patient_status === 'Old') {
        existingPatientStatusCount++;
      }
      if (item.appointment_status === 'Yes') {
        appointmentStatusCount++;
      }
      if (item.action_required === 'Yes') {
        actionRequiredCount++;
      }
      if(flag &&!service_type){
        console.log(hearingTestNumber)
  if (item.to === hearingTestNumber) {
    console.log("1")
    hearingTestCount++;
  } else if (item.to === hearingAidsNumber) {
    console.log("2")
    hearingAidsCount++;
  } else if (item.to === hearingAidsRepairNumber) {
    console.log("3")
    hearingAidsRepairCount++;
  } else if (item.to === tinnitusEvaluationNumber) {
    console.log("4")
    tinnitusEvaluationCount++;
  }
       }
    });
    
    let response = {};
    const existingPatientStatus = Math.abs(answeredCount - newPatientStatusCount);
    response['action_required_count'] = actionRequiredCount;
    response['appointment_status_count'] = appointmentStatusCount;
    response['new_patient_status'] = newPatientStatusCount;
    response['existing_patient_status'] = existingPatientStatus;
    response['answered_calls'] = answeredCount;
    response['unanswered_calls'] = unansweredCount;
    response['heads_up_count'] = headsUpCount;
    response['voice_call_count'] = voiceCallCount;
    response['total_calls'] = answeredCount + unansweredCount;
    if(flag &&!service_type){
    response['hearing_test_count'] = hearingTestCount;
    response['hearing_aids_count'] = hearingAidsCount;
    response['hearing_aids_repair_count'] = hearingAidsRepairCount;
    response['tinnitus_evaluation_count'] = tinnitusEvaluationCount;}
    res.send(response);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
    console.log(err)
  }
}

export const Getcallstatus = async (req, res) => {
  const user_email = req.query.user_email;
  const phone_number=req.query.phone_number
  const period = req.query.period;
  const currentDate = new Date();
  const startDate = new Date(currentDate);
  startDate.setDate(startDate.getDate() - parseInt(period || 0));
 

  const collection = db.collection('transcript_two');
  
  let newtovalue=[];
  //  console.log(newtovalue)
  if(user_email){
 
    // newtovalue = "+" + 19803516969
    newtovalue = ['+1234567890', '+2345678901', '+3456789012', '+4567890123'];

  } 

  if(phone_number){
    // newtovalue ="+" +phone_number;
    newtovalue.push('+' + phone_number);

  }
 
console.log(newtovalue)

  const result = await collection.aggregate([
    {
      $match: {
        trackingnumber: { $in: newtovalue },
      }
     
    },
    {
      $group: {
        _id: "$receptionist"
      }
    },
    {
      $project: {
        _id: 0,
        receptionist: "$_id"
      }
    }
  ]).toArray()
    .then(result => {
      res.send(result);
    })

}