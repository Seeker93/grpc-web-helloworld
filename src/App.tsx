import React, { useState } from 'react';
import './App.css';

const { FileDetails,
  HelloReply, FilesRequest, FilesList } = require('./voxualize-protos/helloworld_pb.js');
const { GreeterClient } = require('./voxualize-protos/helloworld_grpc_web_pb.js');


function App() {

  const [uselessmessage, setUselessmessage] = useState('')
  const [fileslist, setFileslist] = useState('')
  const [message, setMessage] = useState('')
  const [filename, setFilename] = useState('')
  const [dimensionx, setDimensionx] =useState('')
  const [dimensiony, setDimensiony] =useState('')
  const [dimensionz, setDimensionz] =useState('')


  var client = new GreeterClient('http://' + window.location.hostname + ':8080',
    null, null);

  const callGrpcService = () => {
    if(filename == null || filename == ''){
    }
    else{
    var request = new FileDetails();
    request.setFilename(filename);
    request.setDimensionx(dimensionx);
    request.setDimensiony(dimensiony);
    request.setDimensionz(dimensionz);
    client.chooseFile(request, {}, (err: any, response: any) => {
      if (response) {}
      else {
        setMessage('No response from server')
      }
    });
  }
  }

 const onFilenameChange = (event:any)=>{
  if (event !==null){
    setFilename(event.target.files[0].name)
  }
 }

 const requestFiles = () => {
  console.log("requestFiles function being called");
  var request = new FilesRequest();
  request.setUselessmessage("This is a useless message");

  client.listFiles(request, {}, (err: any, response: any) => {
    if (response) {
      // Response contains the file list as a string I think. How to display this?
      setMessage(response.getFileslist())
    }
    else {
      setMessage('Sent requestFiles request. Received no response.')
    }
  });
}


  return (
    <div className="App">
      <header className="App-header">

        <div className="d-flex flex-column my-2">
        <button className="btn-success" onClick={requestFiles}>Click for a list of files</button>
        <input type="file"  onChange={(event)=>{onFilenameChange(event)}} name="Browse..." />

        <input placeholder={"Enter x coordinate"}  value={dimensionx} onChange={(event)=>setDimensionx(event.target.value)} className="my-2" name="X:"/>
        <input placeholder={"Enter y coordinate"} value={dimensiony} onChange={(event)=>setDimensiony(event.target.value)}  className="my-2" name="Y:"/>
        <input placeholder={"Enter z coordinate"}  value={dimensionz} onChange={(event)=>setDimensionz(event.target.value)} className="my-2" name="Z:"/>
        </div>
        {message}
        <button className="btn-success" onClick={callGrpcService}>Click for grpc request</button>

      </header>
    </div>
  );
}

export default App;
