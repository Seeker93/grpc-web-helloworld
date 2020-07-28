import React, { useState } from 'react';
import { FileSelector } from './components/FileSelector'
import './App.css';

const { FileDetails, FilesRequest } = require('./voxualize-protos/voxualize_pb.js');
const { GreeterClient } = require('./voxualize-protos/voxualize_grpc_web_pb.js');


function App() {
  const [message, setMessage] = useState('')
  const [filename, setFileName] = useState('')
  const [filenames, setFileNames] = useState([])

  var client = new GreeterClient('http://' + window.location.hostname + ':8080', null, null);

  
  
  const callGrpcService = () => {
    if(filename === null || filename === ''){
    }
    else {
      var request = new FileDetails();
      request.setFileName(filename);
      var chooseFileClient=  client.chooseFile(request,{})
      chooseFileClient.on('data',(response:any) => {
        if (response) { 
          console.log(response.getBytes())
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
        <h5>{message}</h5>
        <button className="btn btn-success" onClick={callGrpcService}>Render</button>

      </header>
    </div>
  );
}

export default App;