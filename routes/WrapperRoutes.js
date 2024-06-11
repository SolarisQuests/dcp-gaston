import express from "express";
import { Callhistorydata, DashboardCount, FetchCalls, Getcallstatus, Promtstatus, Promtstatustranscript, Recordingandprompt, Transcript} from "../Controller/WrapperController.js";


const wrapperroute = express.Router();


wrapperroute.get("/fetchCalls",FetchCalls);
wrapperroute.get("/promtstatus",Promtstatus);
wrapperroute.get("/promtstatustranscript",Promtstatustranscript);
wrapperroute.get("/transcript",Transcript);
wrapperroute.get("/recordingandprompt",Recordingandprompt);
wrapperroute.get("/callhistorydata",Callhistorydata);
wrapperroute.get("/dashboardCount",DashboardCount);
wrapperroute.get("/getcallstatus",Getcallstatus);
export default wrapperroute;
