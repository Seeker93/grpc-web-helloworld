import React, { useState, useEffect, useRef } from 'react';
import { FileSelector } from './components/FileSelector'
import { AxisSlider } from './components/AxisSlider'
import './App.css';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkVolume from 'vtk.js/Sources/Rendering/Core/Volume';
import vtkVolumeMapper from 'vtk.js/Sources/Rendering/Core/VolumeMapper';
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';
import vtkImageCroppingRegionsWidget from 'vtk.js/Sources/Interaction/Widgets/ImageCroppingRegionsWidget';
import { VtkDataTypes } from 'vtk.js/Sources/Common/Core/DataArray/Constants';
import vtkImageCropFilter from 'vtk.js/Sources/Filters/General/ImageCropFilter';
import vtkInteractorStyleTrackballCamera from 'vtk.js/Sources/Interaction/Style/InteractorStyleTrackballCamera';

import logo from "./logo.svg";
import { observer, useLocalStore } from 'mobx-react'
import { debounce } from './utils/helperFunctions'
const { FileDetails, FilesRequest, CameraInfo, Dummy } = require('./voxualize-protos/voxualize_pb.js');
const { GreeterPromiseClient } = require('./voxualize-protos/voxualize_grpc_web_pb.js');
const { GreeterClient } = require('./voxualize-protos/voxualize_grpc_web_pb.js');



const App = observer(() => {

    const localState = useLocalStore(() => ({
        widget: null,
        planeState: null,
        cropFilter: null,
        renderWindow: null,
        setPlaneState(plane: any) {
            localState.planeState = plane
        },
        setWidgetState(widget: any) {
            localState.widget = widget
        },
        setCropFilter(cropFilter: any) {
            localState.cropFilter = cropFilter
        },
        setRenderWindow(window: any) {
            localState.renderWindow = window
        }
    }))


    const [filename, setFileName] = useState('')
    const [filenames, setFileNames] = useState([])
    const [rawArray, setRawArray] = useState([])
    const [loading, setLoading] = useState(false)
    const [totalBytes, setTotalBytes] = useState(0);
    const [dimensionX, setDimensionX] = useState(0);
    const [dimensionY, setDimensionY] = useState(0);
    const [dimensionZ, setDimensionZ] = useState(0);
    const [cubeLoaded, setCubeLoaded] = useState(false)
    const [extent, setExtent] = useState(null)

    const renderWindowRef = useRef(null);
    const widthRef = useRef(0);
    const heightRef = useRef(0);


    var client = new GreeterPromiseClient('http://' + window.location.hostname + ':8080', null, null);


    const convertBlock = (incomingData) => {
        const slicedArray = incomingData.slice();
        return new Float32Array(slicedArray.buffer);
    }

    useEffect(() => {
        if (totalBytes === 5242880) {
            renderDataCube()
            setCubeLoaded(true)
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
            localState.setPlaneState([0, dimensionX - 1, 0, dimensionY - 1, 0, dimensionZ - 1])

            imageData.setExtent(localState.planeState);
            imageData.getPointData().setScalars(scalars);

            setExtent(imageData.getExtent());

            const cropFilter = vtkImageCropFilter.newInstance();
            var mapper = vtkVolumeMapper.newInstance();
            var volumeActor = vtkVolume.newInstance();

            cropFilter.setInputData(imageData);
            mapper.setInputConnection(cropFilter.getOutputPort())
            mapper.setBlendModeToComposite();
            cropFilter.setCroppingPlanes(...imageData.getExtent())

            volumeActor.setMapper(mapper);
            initProps(volumeActor.getProperty());

            var view3d = document.getElementById("view3d");

            var fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
                rootContainer: view3d,
                containerStyle: {
                    height: '60%',
                    width: '60%',
                    justifyContent: 'center',
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

            let renderWindow = fullScreenRenderer.getRenderWindow();
            localState.setRenderWindow(renderWindow)
            const interactor = vtkInteractorStyleTrackballCamera.newInstance();
            renderWindow.getInteractor().setInteractorStyle(interactor);
            //interactor.bindEvents(view3d)
            const widget = vtkImageCroppingRegionsWidget.newInstance();

            widget.setInteractor(renderWindow.getInteractor());

            widget.setVolumeMapper(mapper);
            widget.setHandleSize(15); // in pixels
            widget.setEnabled(true);

            widget.setCornerHandlesEnabled(true);
            localState.setWidgetState(widget)
            localState.setCropFilter(cropFilter)
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

    const onFileChosen = (filename: any) => {
        setFileName(filename)
        if (filename === null || filename === '') {
            setLoading(false)
        }
    }


    const renderFile = async () => {
        setLoading(true)

        var request = new FileDetails();
        request.setFileName(filename);
        await client.chooseFile(request, {}).then((response: any) => {
            let dimensionsArray = response.getDimensionsLodList()
            console.log(dimensionsArray)
            setDimensionX(dimensionsArray[0])
            setDimensionY(dimensionsArray[1])
            setDimensionZ(dimensionsArray[2])
        }).catch((err: any) => { console.log(err) }).then(() => {

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
        }).catch((err: any) => console.log(err))
    }



    const debounceLog = (thisRenderer: any) => debounce(new function () {
        var request = new CameraInfo();
        const positionList = thisRenderer.getActiveCamera().getPosition()
        const focalPointList = thisRenderer.getActiveCamera().getFocalPoint()
        widthRef.current = renderWindowRef.current.offsetWidth
        heightRef.current = renderWindowRef.current.offsetHeight

        request.setPositionList(positionList)
        request.setFocalPointList(focalPointList)
        request.setWindowWidth(widthRef.current)
        request.setWindowHeight(heightRef.current)

        console.log("Position: " + positionList)
        console.log("Focal point: " + focalPointList)
        console.log("Width: " + widthRef.current)
        console.log("Height: " + heightRef.current)
        var renderClient = client.getHighQualityRender(request, {})

        renderClient.on('data', (response: any, err: any) => {
            if (response) {
                console.log(response)
            };
            if (err) {
                console.log(err)
            }
        })

    }, 250)


    const requestFiles = () => {
        var request = new FilesRequest();
        request.setUselessMessage("This is a useless message");
        client.listFiles(request, {}).then((response: any) => setFileNames(response.getFilesList())).catch((err: any) => { console.log(err) });
    }



    return (
        <div className="App d-flex container-fluid row">
            <div className="col col-sm-2 bg-dark pt-5">
                <h3 className="pb-5 text-light">Voxualize</h3>
                <FileSelector className="pb-5" files={filenames} name={"Choose a file ..."} onClick={requestFiles} onItemSelected={(file: any) => { onFileChosen(file) }} />
                <div></div>
                <button className="btn btn-success mt-5" onClick={renderFile}>Render</button>

            </div>
            <div className="rendering-window" id="view3d" ref={renderWindowRef}>

                {loading &&
                    <img src={logo} className="App-logo" alt="logo" />
                }

            </div>
            <div className="fixed-bottom bg-dark h-25 justify-content-center">
                {cubeLoaded && <AxisSlider extent={extent} localState={localState} />}


            </div>
        </div>
    );

})

export default App