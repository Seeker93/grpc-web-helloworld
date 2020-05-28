import React, {useState} from 'react';
import logo from './logo.svg';
import './App.css';

const {HelloRequest,
  HelloReply} = require('./protos/helloworld_pb.js');
const {GreeterClient} = require('./protos/helloworld_grpc_web_pb.js');


function App() {
  
  const [message, setMessage] =useState('')

  var client = new GreeterClient('http://' + window.location.hostname + ':8080',
  null, null);

  const callGrpcService = ()=>{
  var request = new HelloRequest();
  request.setName('World');
  
  client.sayHello(request, {}, (err:any, response:any) => {
    if(response){
    setMessage(response.getMessage())
    }
    else{
      setMessage('No response from server')
    }
  });

}
  

  return (
    <div className="App">
      <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <button style={{padding:10}} onClick={callGrpcService}>Click for grpc request</button>
          {message}
        </header>
    </div>
  );
}

export default App;
