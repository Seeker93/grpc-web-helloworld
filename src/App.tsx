import React, { useState } from 'react';
import { FileSelector } from './components/FileSelector'
import './App.css';
import {InputGroup } from "@blueprintjs/core";

const { FileDetails, FilesRequest } = require('./voxualize-protos/helloworld_pb.js');
const { GreeterClient } = require('./voxualize-protos/helloworld_grpc_web_pb.js');


function App() {
  const [message, setMessage] = useState('')
  const [filename, setFileName] = useState('')
  const [dimensionx, setDimensionx] = useState('')
  const [dimensiony, setDimensiony] = useState('')
  const [dimensionz, setDimensionz] = useState('')
  const [filenames, setFileNames] = useState([])

  var client = new GreeterClient('http://' + window.location.hostname + ':8080', null, null);

  
  const callGrpcService = () => {
    if(filename === null || filename === ''){
    }
    else {
      var request = new FileDetails();
      request.setFileName(filename);
      request.setDimensionx(dimensionx);
      request.setDimensiony(dimensiony);
      request.setDimensionz(dimensionz);
      client.chooseFile(request, {}, (err: any, response: any) => {
        if (response) { 


        }
        else {
          console.log(err);
          setMessage('No response from server');
        }
      });
    }
  }
 
  const requestFiles = ()=>{
    var request = new FilesRequest();
    request.setUselessMessage("This is a useless message");

    client.listFiles(request, {}, (err: any, response: any) => {
      if (response) {
        setFileNames(response.getFilesList());
      }
      else {
        setMessage('Cannot contact server at this time' )
      }
    });
  }


  return (
    <div className="App">
      <header className="App-header">
        <FileSelector files={filenames} name={"Choose a file ..."} onClick={requestFiles} onItemSelected={(file: any) => {setFileName(file)}} />
        <div className="d-flex flex-column my-4 ">
          <InputGroup  placeholder={"Enter x coordinate"} value={dimensionx} onChange={(event:any) => setDimensionx(event.target.value)}  name="X:" />
          <InputGroup  placeholder={"Enter y coordinate"} value={dimensiony} onChange ={(event:any) => setDimensiony(event.target.value)}  name="Y:" />
          <InputGroup  placeholder={"Enter z coordinate"} value={dimensionz} onChange={(event:any) => setDimensionz(event.target.value)}  name="Z:" />
        </div>
        <h5>{message}</h5>
        <button className="btn btn-success" onClick={callGrpcService}>Render</button>

      </header>
    </div>
  );
}

export default App;