import React, { useState, useEffect, useRef } from 'react';
import { FileSelector } from './components/FileSelector'
import { AxisSlider } from './components/AxisSlider'
import { LodSizeSlider } from './components/LodSizeSlider'

import './App.css';
import { H264Decoder } from 'h264decoder';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkVolume from 'vtk.js/Sources/Rendering/Core/Volume';
import vtkVolumeMapper from 'vtk.js/Sources/Rendering/Core/VolumeMapper';
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';
import vtkImageCroppingRegionsWidget from 'vtk.js/Sources/Interaction/Widgets/ImageCroppingRegionsWidget';
import { VtkDataTypes } from 'vtk.js/Sources/Common/Core/DataArray/Constants';
import vtkImageMapper from 'vtk.js/Sources/Rendering/Core/ImageMapper';
import vtkImageSlice from 'vtk.js/Sources/Rendering/Core/ImageSlice';
import vtkRTAnalyticSource from 'vtk.js/Sources/Filters/Sources/RTAnalyticSource';
import vtkInteractorStyleImage from 'vtk.js/Sources/Interaction/Style/InteractorStyleImage';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRenderWindowInteractor from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor';

import Constants from 'vtk.js/Sources/Rendering/Core/ImageMapper/Constants';

import vtkImageCropFilter from 'vtk.js/Sources/Filters/General/ImageCropFilter';
import vtkInteractorStyleTrackballCamera from 'vtk.js/Sources/Interaction/Style/InteractorStyleTrackballCamera';

import logo from "./logo.svg";
import { observer, useLocalStore } from 'mobx-react'
import { debounce } from './utils/helperFunctions'
import { TransferFunctionSlider } from './components/TransferFunctionSlider';

const { FileDetails, FilesRequest, CameraInfo, GetDataRequest } = require('./voxualize-protos/voxualize_pb.js');
const { GreeterPromiseClient } = require('./voxualize-protos/voxualize_grpc_web_pb.js');

const { SlicingMode } = Constants;


const App = observer(() => {

    const localState = useLocalStore(() => ({
        widget: null,
        planeState: null,
        cropFilter: null,
        renderer: null,
        renderWindow: null,
        volumeActor: null,
        colorTransferFunction: null,
        axesChanged: false,
        lodMemorySize: 10,
        openGlWindow: null,
        actor: null,
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
        },
        setVolumeActor(actor: any) {
            localState.volumeActor = actor
        },
        setColorTransferFunction(fun: any) {
            localState.colorTransferFunction = fun;
        },
        setRenderer(ren: any) {
            localState.renderer = ren;
        },
        flipAxesChanged() {
            localState.axesChanged = !localState.axesChanged;
        },
        setLodMemorySizrte(memorySize: number) {
            localState.lodMemorySize = memorySize;
        },
        setOpenGlWindow(window: any) {
            localState.openGlWindow = window;
        },
        setActor(actor: any) {
            localState.actor = actor;
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
    const [lodNumBytes, setLodNumBytes] = useState(0);
    const [hqNumBytes, setHqNumBytes] = useState(0);
    const [cubeLoaded, setCubeLoaded] = useState(false)
    const [highResLoaded, setHighResLoaded] = useState(false)
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
        if (totalBytes > 0 && totalBytes === lodNumBytes) {
            renderDataCube()
            setCubeLoaded(true)
        }

    }, [totalBytes]);

    useEffect(() => { // Called whenever the cropping planes are changed or when memory size is changed

        if (localState.planeState !== null && localState.renderer !== null) {
            let request = captureCameraInfo();
            client.getNewROILODSize(request, {}).then((response: any) => {
                setLodNumBytes(response.getTrueSizeLodBytes())  // Set the number of bytes in the LOD model to the new value
            }).catch((err: any) => {
                console.log(err)
            }).then(() => {
                // renderLodModel() // rendering LOD model for now. Will change when hybrid rendering is in place
            })
        }
    }, [localState.planeState, localState.axesChanged, localState.lodMemorySize]);

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

    const render2DImage = () => { // Placeholder method. Just renders a random image
        setHighResLoaded(true)
        // if (localState.openGlWindow && localState.renderWindow) {
        //     localState.openGlWindow.setSize(0, 0)
        // }

        const renderWindow = vtkRenderWindow.newInstance();
        localState.setRenderWindow(renderWindow)

        const renderer = vtkRenderer.newInstance({
            background: [220, 185, 152]
        });

        localState.setRenderer(renderer)
        localState.renderWindow.addRenderer(renderer);

        const rtSource = vtkRTAnalyticSource.newInstance();
        rtSource.setWholeExtent(0, 200, 0, 200, 0, 200);
        rtSource.setCenter(100, 100, 100);
        rtSource.setStandardDeviation(0.3);

        const mapper = vtkImageMapper.newInstance();
        mapper.setInputConnection(rtSource.getOutputPort());
        mapper.setSliceAtFocalPoint(true);
        mapper.setSlicingMode(SlicingMode.Z);
        const rgb = vtkColorTransferFunction.newInstance();
        rgb.addRGBPoint(0, 0, 0, 0);
        rgb.addRGBPoint(255, 1, 1, 1);

        const ofun = vtkPiecewiseFunction.newInstance();
        ofun.addPoint(0, 1);
        ofun.addPoint(150, 1);
        ofun.addPoint(180, 0);
        ofun.addPoint(255, 0);


        const actor = vtkImageSlice.newInstance();
        localState.setActor(actor)
        localState.actor.getProperty().setColorWindow(255);
        localState.actor.getProperty().setColorLevel(127);
        // Uncomment this if you want to use a fixed colorwindow/level
        // actor.getProperty().setRGBTransferFunction(rgb);
        localState.actor.getProperty().setPiecewiseFunction(ofun);
        localState.actor.setMapper(mapper);
        localState.renderer.addActor(actor);

        const camera = localState.renderer.getActiveCamera();
        const position = camera.getFocalPoint();
        // offset along the slicing axis
        const normal = mapper.getSlicingModeNormal();
        position[0] += normal[0];
        position[1] += normal[1];
        position[2] += normal[2];
        camera.setPosition(...position);
        switch (mapper.getSlicingMode()) {
            case SlicingMode.X:
                camera.setViewUp([0, 1, 0]);
                break;
            case SlicingMode.Y:
                camera.setViewUp([1, 0, 0]);
                break;
            case SlicingMode.Z:
                camera.setViewUp([0, 1, 0]);
                break;
            default:
        }
        camera.setParallelProjection(true);
        localState.renderer.resetCamera();
        localState.renderWindow.render();
        const openglRenderWindow = vtkOpenGLRenderWindow.newInstance();
        localState.setOpenGlWindow(openglRenderWindow);
        localState.renderWindow.addView(localState.openGlWindow);

        var view2d = document.getElementById("view2d");
        localState.openGlWindow.setContainer(view2d)
        view2d.addEventListener('mouseDown', () => setHighResLoaded(false));

        const dims = view2d.getBoundingClientRect();
        localState.openGlWindow.setSize(dims.width, dims.height)
        const interactor = vtkRenderWindowInteractor.newInstance();
        interactor.setView(localState.openGlWindow);
        interactor.initialize();
        interactor.bindEvents(view2d);
    }

    const renderDataCube = () => {
        setLoading(true)

        function initCubeVolume() {
            let width = dimensionX; let height = dimensionY; let depth = dimensionZ;

            const renderWindow = vtkRenderWindow.newInstance(); //Now uses RenderWindow instead of Fullscreen render window
            localState.setRenderWindow(renderWindow)

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
            localState.setVolumeActor(volumeActor)

            var view3d = document.getElementById("view3d");
            view3d.addEventListener('mouseup', debounceLog);

            const renderer = vtkRenderer.newInstance({
                background: [220, 185, 152]
            });

            renderer.addVolume(volumeActor);
            renderer.getActiveCamera().elevation(30);
            renderer.getActiveCamera().azimuth(45);
            renderer.resetCamera();
            localState.renderWindow.render();
            localState.setRenderer(renderer)
            localState.renderWindow.addRenderer(renderer);

            const openglRenderWindow = vtkOpenGLRenderWindow.newInstance();
            localState.setOpenGlWindow(openglRenderWindow);
            localState.renderWindow.addView(localState.openGlWindow);
            localState.openGlWindow.setContainer(view3d)
            const dims = view3d.getBoundingClientRect();
            localState.openGlWindow.setSize(dims.width, dims.height)

            const interactor = vtkRenderWindowInteractor.newInstance();
            interactor.setView(localState.openGlWindow);
            interactor.initialize();
            interactor.bindEvents(view3d);
            interactor.setInteractorStyle(vtkInteractorStyleTrackballCamera.newInstance());
            localState.setCropFilter(cropFilter)

            const widget = vtkImageCroppingRegionsWidget.newInstance();

            widget.setInteractor(interactor);

            widget.setVolumeMapper(mapper);
            widget.setHandleSize(15); // in pixels
            widget.setEnabled(true);

            widget.setCornerHandlesEnabled(true);
            widget.setEdgeHandlesEnabled(true);

            localState.setWidgetState(widget)
        }

        function initProps(property) {
            property.setRGBTransferFunction(0, newColorFunction());
            property.setScalarOpacity(0, newOpacityFunction());
            property.setInterpolationTypeToNearest();
            property.setUseGradientOpacity(0, false);

        }

        function newColorFunction() {
            var fun = vtkColorTransferFunction.newInstance();
            localState.setColorTransferFunction(fun)
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
    console.log(highResLoaded)
    const onFileChosen = (filename: any) => {
        setFileName(filename)
        if (filename === null || filename === '') {
            setLoading(false)
        }
    }

    const renderLodModel = () => {
        console.log('Receiving LOD model')
        var renderFileRequest = new GetDataRequest();
        renderFileRequest.setDataObject(0); // sets the data object to LODModel
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

    const renderHqModel = () => {  // Not fully implemented yet
        console.log('Receiving HQ model')

        var request = new GetDataRequest()
        request.setDataObject(1); // sets the data object to HQRender
        var renderClient = client.getModelData(request, {})
        const decoder = new H264Decoder();
        renderClient.on('data', (response: any, err: any) => {
            if (response) {
                // console.log(response.getBytes())
                // console.log(decoder.decode(response.getBytes()))
                // console.log(decoder.pic)
            };
            if (err) {
                console.log(err)
            }
        })
    }

    const renderFile = async () => {
        setLoading(true)

        var request = new FileDetails();
        request.setFileName(filename);
        request.setTargetSizeLodBytes(localState.lodMemorySize); //Set the LOD memory size to the size selected
        await client.chooseFile(request, {}).then((response: any) => {
            let dimensionsArray = response.getDimensionsLodList()
            console.log(dimensionsArray)
            setDimensionX(dimensionsArray[0])
            setDimensionY(dimensionsArray[1])
            setDimensionZ(dimensionsArray[2])
            setLodNumBytes(response.getLodNumBytes())
        }).catch((err: any) => { console.log(err) }).then(() => {
            renderLodModel()
        })
    }

    const captureCameraInfo = () => {

        if (localState.renderer !== null) {
            const request = new CameraInfo();

            const positionList = localState.renderer.getActiveCamera().getPosition()
            const focalPointList = localState.renderer.getActiveCamera().getFocalPoint()
            widthRef.current = renderWindowRef.current.offsetWidth
            heightRef.current = renderWindowRef.current.offsetHeight
            const viewUpList = localState.renderer.getActiveCamera().getViewUp()
            const distance = localState.renderer.getActiveCamera().getDistance()
            const rgba = [localState.colorTransferFunction.getRedValue(0), localState.colorTransferFunction.getGreenValue(0), localState.colorTransferFunction.getBlueValue(0)]
            const alpha = localState.colorTransferFunction.getAlpha();
            const croppingPlanes = localState.cropFilter.getCroppingPlanes()

            request.setTargetSizeLodBytes(localState.lodMemorySize);
            request.setCroppingPlanesList(croppingPlanes)
            request.setRgbaList(rgba)
            request.setAlpha(alpha)
            request.setPositionList(positionList)
            request.setFocalPointList(focalPointList)
            request.setWindowWidth(widthRef.current)
            request.setWindowHeight(heightRef.current)
            request.setViewUpList(viewUpList)
            request.setDistance(distance)
            console.log("Position: " + positionList)
            console.log("Focal point: " + focalPointList)
            console.log("Width: " + widthRef.current)
            console.log("Height: " + heightRef.current)
            console.log("ViewUp: " + viewUpList)
            console.log("Distance: " + distance)
            console.log("rgb: " + rgba)
            console.log("Alpha: " + alpha)
            console.log("Cropping planes: " + localState.cropFilter.getCroppingPlanes())

            return request
        }
        else {
            return null
        }
    }


    const debounceLog = () => debounce(new function () {
        let request = captureCameraInfo()

        client.getHQRenderSize(request, {}).then((response: any) => {
            setHqNumBytes(response.getSizeInBytes())
        }).catch((err: any) => { console.log(err) }).then(() => {
            renderHqModel()
        }).then(() => render2DImage())
    }, 250)


    const requestFiles = () => {
        var request = new FilesRequest();
        request.setUselessMessage("This is a useless message");
        client.listFiles(request, {}).then((response: any) => setFileNames(response.getFilesList())).catch((err: any) => { console.log(err) });
    }


    return (
        <div className="container-fluid" >
            <div className="row bg-dark">
                <h3 className="col text-light mt-auto mb-auto ">Voxualize</h3>
                <div className={"d-flex align-items-center justify-content-end"}>
                    <FileSelector className="col flex-end" files={filenames} name={"Choose a file ..."} onClick={requestFiles} onItemSelected={(file: any) => { onFileChosen(file) }} />
                </div>
                <div className={"d-flex justify-content-end px-5 py-2"}>
                    <button className="col btn btn-success " onClick={renderFile}>Render</button>
                </div>
            </div>
            {highResLoaded &&
                <div className="row rendering-window" id="view2d" ref={renderWindowRef}>
                    {/* Rendering happens in this div */}
                    {loading &&
                        <img src={logo} className="App-logo" alt="logo" />
                    }
                </div>
            }
            {!highResLoaded &&
                <div className="row rendering-window" id="view3d" ref={renderWindowRef}>
                    {/* Rendering happens in this div */}
                    {loading &&
                        <img src={logo} className="App-logo" alt="logo" />
                    }
                </div>
            }
            <div className="fixed-bottom bg-dark h-25 justify-content-center row">
                <div className={"col col-lg-2"}>
                    {cubeLoaded && <LodSizeSlider localState={localState} />}
                </div>
                <div className={"col col-lg-6"}>
                    {cubeLoaded && <AxisSlider extent={extent} localState={localState} />}
                </div>
                <div className={"col col-lg-2"}>
                    {cubeLoaded && <TransferFunctionSlider localState={localState} />}
                </div>

            </div>
        </div>
    );

})

export default App