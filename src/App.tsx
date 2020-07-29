import React, { useState } from 'react';
import { FileSelector } from './components/FileSelector'
import './App.css';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkVolume from 'vtk.js/Sources/Rendering/Core/Volume';
import vtkVolumeMapper from 'vtk.js/Sources/Rendering/Core/VolumeMapper';
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';
import { VtkDataTypes } from 'vtk.js/Sources/Common/Core/DataArray/Constants';

const { FileDetails, FilesRequest } = require('./voxualize-protos/voxualize_pb.js');
const { GreeterClient } = require('./voxualize-protos/voxualize_grpc_web_pb.js');



function App() {
    const [message, setMessage] = useState('')
    const [filename, setFileName] = useState('')
    const [filenames, setFileNames] = useState([])
    const [fileChosen, setFileChosen] = useState(false)
    const [rawArray, setRawArray] = useState([])

    var client = new GreeterClient('http://' + window.location.hostname + ':8080', null, null);

    const renderDataCube = () => {
        console.log('gets to render')

        function initCubeVolume() {
            var width = 255, height = 255, depth = 159;
            var values = new Float32Array(rawArray);

            console.log(values)

            var scalars = vtkDataArray.newInstance({
                values: values,
                numberOfComponents: 1, // number of channels (grayscale)
                dataType: VtkDataTypes.FLOAT, // values encoding
                name: 'scalars'
            });

            var imageData = vtkImageData.newInstance();
            imageData.setOrigin(0, 0, 0);
            imageData.setSpacing(1, width / height, width / depth);
            imageData.setExtent(0, width - 1, 0, height - 1, 0, depth - 1);
            imageData.getPointData().setScalars(scalars);

            var volumeMapper = vtkVolumeMapper.newInstance();
            volumeMapper.setInputData(imageData);
            volumeMapper.setBlendModeToComposite();

            var volumeActor = vtkVolume.newInstance();
            volumeActor.setMapper(volumeMapper);

            initProps(volumeActor.getProperty());

            var view3d = document.getElementById("view3d");
            var fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
                rootContainer: view3d,
                containerStyle: {
                    height: '100%',
                    overflow: 'hidden'
                },
                background: [0, 0, 0]
            });

            var renderer = fullScreenRenderer.getRenderer();
            renderer.addVolume(volumeActor);
            renderer.getActiveCamera().elevation(30);
            renderer.getActiveCamera().azimuth(45);

            renderer.resetCamera();

            var renderWindow = fullScreenRenderer.getRenderWindow();
            renderWindow.render();
        }

        function initProps(property) {
            property.setRGBTransferFunction(0, newColorFunction());
            property.setScalarOpacity(0, newOpacityFunction());
            property.setInterpolationTypeToNearest();
            property.setUseGradientOpacity(0, true);
            property.setShade(true);
        }

        function newColorFunction() {
            var fun = vtkColorTransferFunction.newInstance();
            fun.addRGBPoint(-0.0, 0.0, 0.0, 0.0);
            fun.addRGBPoint(0.16, 1.0, 1.0, 1.0);
            return fun;
        }

        function newOpacityFunction() {
            var fun = vtkPiecewiseFunction.newInstance();
            fun.addPoint(-0, 0);
            fun.addPoint(0.16, 1);
            return fun;
        }
        initCubeVolume();
        setFileChosen(true)

    }
    console.log(rawArray)

    const callGrpcService = async () => {


        if (filename === null || filename === '') {
        }
        else {
            var request = new FileDetails();
            request.setFileName(filename);
            var chooseFileClient = client.chooseFile(request, {})
            chooseFileClient.on('data', (response: any) => {
                setRawArray(response.getBytes())
            }
            )
        }
    }
    const requestFiles = () => {
        var request = new FilesRequest();
        request.setUselessMessage("This is a useless message");

        client.listFiles(request, {}, (err: any, response: any) => {
            if (response) {
                setFileNames(response.getFilesList());
            }
            else {
                setMessage('Cannot contact server at this time')
            }
        });
    }

    const onClickRender = () => {
        callGrpcService()

    }

    const onSecondClick = () => {
        renderDataCube()

    }

    if (!fileChosen) {
        return (

            <div className="App">
                <header className="App-header">
                    <FileSelector files={filenames} name={"Choose a file ..."} onClick={requestFiles} onItemSelected={(file: any) => { setFileName(file) }} />
                    <h5>{message}</h5>
                    <button className="btn btn-success" onClick={onClickRender}>Get cube data</button>
                    <button className="btn btn-success" onClick={onSecondClick}>Render</button>

                </header>
            </div>
        );
    }
    else if (fileChosen) {
        return React.createElement('div');
    }
}

export default App;