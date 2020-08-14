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

const { FileDetails, FilesRequest, CameraInfo, Dummy } = require('./voxualize-protos/voxualize_pb.js');
const { GreeterClient } = require('./voxualize-protos/voxualize_grpc_web_pb.js');


function App() {
    const [message, setMessage] = useState('')
    const [filename, setFileName] = useState('')
    const [filenames, setFileNames] = useState([])
    const [rawArray, setRawArray] = useState([])
    const [loading, setLoading] = useState(false)
    const [totalBytes, setTotalBytes] = useState(0);
    const [dimensionX, setDimensionX] = useState(0);
    const [dimensionY, setDimensionY] = useState(0);
    const [dimensionZ, setDimensionZ] = useState(0);


    var client = new GreeterClient('http://' + window.location.hostname + ':8080', null, null);

    const convertBlock = (incomingData) => {
        const slicedArray = incomingData.slice();
        return new Float32Array(slicedArray.buffer);
    }

    useEffect(() => {
        if (totalBytes === 5242880) {
            renderDataCube()
         }
        
    }, [totalBytes]);

    function concatArrays() { // a, b TypedArray of same type
        let array = rawArray

        // Get the total length of all arrays.
        let length = 0;
        array.forEach(item => {

            length += item.length;
        });

        // Create a new array with total length and merge all source arrays.
        let mergedArray = new Uint8Array(length);
        let offset = 0;
        array.forEach(item => {
            mergedArray.set(item, offset);
            offset += item.length;
        });

        // Should print an array with length 90788 (5x 16384 + 8868 your source arrays)
        return mergedArray
    }

    const renderDataCube = () => {
        setLoading(true)

        function initCubeVolume() {
            let width = dimensionX; let height = dimensionY; let depth = dimensionZ;
            var rawValues = concatArrays()
            var values = convertBlock(rawValues);
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
                    height: '60%',
                    width: '60%',
                    padding: '10px'
                },
                background: [220, 185, 152]
            });
            view3d.addEventListener('mouseup', () => debounceLog(renderer));
            var renderer = fullScreenRenderer.getRenderer();
            renderer.addVolume(volumeActor);
            renderer.getActiveCamera().elevation(30);
            renderer.getActiveCamera().azimuth(45);


            renderer.resetCamera();

            var renderWindow = fullScreenRenderer.getRenderWindow();
            const interactor = fullScreenRenderer.getRenderWindow().getInteractor();
            interactor.bindEvents(view3d)
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

    const onFileChosen = (filename: any) =>{
        setFileName(filename)
        if (filename === null || filename === '') {
            setLoading(false)
        }

        else {
            var request = new FileDetails();
            request.setFileName(filename);
            client.chooseFile(request, {}, (err: any, response: any) => {
                if (err) {
                    console.log(err)
                }
                else {
                    let dimensionsArray = response.getDimensionsLodList()
                    console.log(dimensionsArray)
                    setDimensionX(dimensionsArray[0])
                    setDimensionY(dimensionsArray[1])
                    setDimensionZ(dimensionsArray[2])
                }
            })

        }
    }


    const renderFile = ()=>{
        setLoading(true)
        var renderFileRequest = new Dummy();
        var renderFileClient = client.getModelData(renderFileRequest, {})

        renderFileClient.on('data', (response: any, err: any) => {
            setRawArray(rawArray => rawArray.concat(response.getBytes()))
            setTotalBytes(totalBytes => totalBytes + response.getNumBytes())
            if (err) {
                setLoading(false)
            }
        }
        )
    }

    const debounce = (func, delay) => {
        let debounceTimer
        return function () {
            const context = this
            const args = arguments
            clearTimeout(debounceTimer)
            debounceTimer
                = setTimeout(() => func.apply(context, args), delay)
        }
    }

    var debounceLog = (thisRenderer: any) => debounce(new function () {
        var request = new CameraInfo();
        const positionList = thisRenderer.getActiveCamera().getPosition()
        const focalPointList = thisRenderer.getActiveCamera().getFocalPoint()
        console.log("Position: " + positionList)
        console.log("Focal point: " + focalPointList)
        request.setPositionList(positionList)
        request.setFocalPointList(focalPointList)
        client.getHighQualityRender(request, {}, (err: any, response: any) => {
            if (response) {
                console.log(response)
            }
            else {
                console.log(err)
            }
        })
    }, 250)


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

    return (
        <div className="App d-flex container-fluid row">
            <div className="col col-sm-2 bg-dark pt-5">
                <h3 className="pb-5 text-light">Voxualize</h3>
                <FileSelector className="pb-5" files={filenames} name={"Choose a file ..."} onClick={requestFiles} onItemSelected={(file: any) => { onFileChosen(file) }} />
                <h5>{message}</h5>
                <button className="btn btn-success mt-5" onClick={renderFile}>Render</button>
            </div>
            <div className="Rendering-window" id="view3d">
                {loading &&
                    <img src={logo} className="App-logo" alt="logo" />
                }
            </div>

        </div>
    );


}

export default App