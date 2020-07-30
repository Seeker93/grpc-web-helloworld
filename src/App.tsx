import React, { useState, useEffect } from 'react';
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
import logo from "./logo.svg";

const { FileDetails, FilesRequest } = require('./voxualize-protos/voxualize_pb.js');
const { GreeterClient } = require('./voxualize-protos/voxualize_grpc_web_pb.js');


function App() {
    const [message, setMessage] = useState('')
    const [filename, setFileName] = useState('')
    const [filenames, setFileNames] = useState([])
    const [rawArray, setRawArray] = useState([])
    const [loading, setLoading] = useState(false)
    const [cubeLoaded, setCubeLoaded] = useState(false)


    var client = new GreeterClient('http://' + window.location.hostname + ':8080', null, null);

    const convertBlock = (incomingData) => {
        const slicedArray = incomingData.slice();
        return new Float32Array(slicedArray.buffer);
    }

    useEffect(() => {
        renderDataCube()

    }, [cubeLoaded]);

    
    const renderDataCube = () => {
        setLoading(true)

        function initCubeVolume() {
            var width = 256, height = 256, depth = 159;
            var values = convertBlock(rawArray);

            var scalars = vtkDataArray.newInstance({
                values: values,
                numberOfComponents: 1, // number of channels (grayscale)
                dataType: VtkDataTypes.FLOAT, // values encoding
                name: 'scalars'
            });

            var imageData = vtkImageData.newInstance();
            imageData.setOrigin(0, 0, 0);
            imageData.setSpacing(1.0, (width / height).toFixed(2), (width / depth).toFixed(2));
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
                    height: '75%',
                    width: '75%',
                },
                background: [220, 185, 152]
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
            property.setUseGradientOpacity(0, false);

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
        setLoading(false)
    }

    const getFileData = () => {

        if (filename === null || filename === '') {
            setLoading(false)
        }

        else {
            setLoading(true)

            var request = new FileDetails();
            request.setFileName(filename);
            var chooseFileClient = client.chooseFile(request, {})
            chooseFileClient.on('data', (response: any, err: any) => {
                setRawArray(response.getBytes())
                setLoading(false)
                setCubeLoaded(true)
                if (err) {
                    setLoading(false)
                }
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


    console.log(loading)
    return (
        <div className="App d-flex container-fluid row">
            <div className="col col-sm-2 bg-dark pt-5">
                <h3 className="pb-5 text-light">Voxualize</h3>
                <FileSelector className="pb-5" files={filenames} name={"Choose a file ..."} onClick={requestFiles} onItemSelected={(file: any) => { setFileName(file) }} />
                <h5>{message}</h5>
                <button className="btn btn-success mt-5" onClick={getFileData}>Render</button>
            </div>
            {loading &&
                <header className="App-header">
                    <img src={logo} className="App-logo" alt="logo" />
                </header>
            }
            {cubeLoaded &&
                <div id="view3d" className="render-window">

                </div>
            }

        </div>
    );


}

export default App;