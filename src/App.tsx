import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FileSelector } from './components/FileSelector'
import { AxisSlider } from './components/AxisSlider'
import { TransferFunctionSlider } from './components/TransferFunctionSlider'

import { LodSizeSlider } from './components/LodSizeSlider'
import { AlignmentSelect } from "./components/AlignmentSelect";
import { Alignment } from "@blueprintjs/core";
import './App.css';

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
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRenderWindowInteractor from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor';
import vtkImageCropFilter from 'vtk.js/Sources/Filters/General/ImageCropFilter';
import vtkInteractorStyleTrackballCamera from 'vtk.js/Sources/Interaction/Style/InteractorStyleTrackballCamera';
import { v4 as uuidv4 } from 'uuid';
import logo from "./logo.svg";
import { observer, useLocalStore } from 'mobx-react'
import { debounce, YUV2RBG } from './utils/helperFunctions'

import classNames from 'classnames/bind';

const worker = require('workerize-loader!./worker'); // eslint-disable-line import/no-webpack-loader-syntax
const { FileDetails, FilesRequest, CameraInfo, GetDataRequest } = require('./voxualize-protos/voxualize_pb.js');
const { GreeterPromiseClient } = require('./voxualize-protos/voxualize_grpc_web_pb.js');

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
        axesReleased: false,
        lodMemorySize: 10,
        oldLodSize: 10,
        openGlWindow: null,
        actor: null,
        hqData: [],
        mapper: null,
        sliceRenderer: null,
        interactor: null,
        cubeReset: false,
        extent: null,
        sampleType: 0,
        originalArray: null,
        originalDimensions: null,
        currentUuid: "",
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
        flipAxesReleased() {
            localState.axesReleased = !localState.axesReleased;
        },
        setOpenGlWindow(window: any) {
            localState.openGlWindow = window;
        },
        setActor(actor: any) {
            localState.actor = actor;
        },
        setHqData(data: any) {
            localState.hqData = data;
        },
        setSliceRenderer(slice: any) {
            localState.sliceRenderer = slice;
        },
        setLodMemorySize(size: number) {
            localState.lodMemorySize = size;
        },
        setMapper(mapper: any) {
            localState.mapper = mapper;
        },
        setInteractor(interactor: any) {
            localState.interactor = interactor;
        },
        flipCubeReset() {
            localState.cubeReset = !localState.cubeReset
        },
        setExtent(extent: any) {
            localState.extent = extent;
        },
        setSampleType(type: number) {
            localState.sampleType = type;
        },
        setOldLodSize(size: number) {
            localState.oldLodSize = size;
        },
        setOriginalArray(arr: any) {
            localState.originalArray = arr;
        },
        setOriginalDimensions(dims: any) {
            localState.originalDimensions = dims;
        },
        setCurrentUuid(uuid: string) {
            localState.currentUuid = uuid;
        }
    }))


    const [filename, setFileName] = useState('')
    const [filenames, setFileNames] = useState([])
    const [rawArray, setRawArray] = useState([])
    const [loading, setLoading] = useState(false)
    const [hqData, setHqData] = useState([])
    const [totalBytes, setTotalBytes] = useState(0);
    const [totalHqBytes, setTotalHqBytes] = useState(0);
    const [dimensionX, setDimensionX] = useState(0);
    const [dimensionY, setDimensionY] = useState(0);
    const [dimensionZ, setDimensionZ] = useState(0);
    const [lodNumBytes, setLodNumBytes] = useState(0);
    const [hqNumBytes, setHqNumBytes] = useState(0);
    const [cubeLoaded, setCubeLoaded] = useState(false)
    const [firstStream, setFirstStream] = useState(true)
    const [fullModel, setFullModel] = useState(false)
    const [minPixel, setMinPixel] = useState(0);
    const [maxPixel, setMaxPixel] = useState(0);
    const [alignIndicator, setAlignIndicator] = useState(Alignment.RIGHT);
    const renderWindowLodRef = useRef(null);

    const widthRef = useRef(0);
    const heightRef = useRef(0);


    var client = new GreeterPromiseClient('http://' + window.location.hostname + ':8080', null, null);


    const convertBlock = (incomingData: any) => {
        const slicedArray = incomingData.slice();
        return new Float32Array(slicedArray.buffer);
    }

    useEffect(() => {
        if (totalBytes > 0 && totalBytes === lodNumBytes) {
            setCubeLoaded(true)
            renderDataCube(rawArray, [dimensionX, dimensionY, dimensionZ])

        }

    }, [totalBytes]);

    useEffect(() => {

        if (totalHqBytes > 0 && totalHqBytes === hqNumBytes) {
            decode2DImage()
            setCubeLoaded(true)
        }

    }, [totalHqBytes]);

    useEffect(() => {
        removeImage()
    }, [localState.axesChanged]);

    useEffect(() => {
        if (cubeLoaded) {
            debounceLog()
        }
    }, [localState.axesReleased])


    const concatArrays = (arrayToConcat: any) => { // a, b TypedArray of same type
        let array = arrayToConcat

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


    const removeImage = useCallback(() => { //Usecallback makes sure that all signatures of this same method are the same
        if (localState.renderWindow) {
            localState.renderWindow.removeRenderer(localState.sliceRenderer) // Remove slice when the user clicks the static image
        }
    }, [])

    const getNewLodModel = () => {
        if (JSON.stringify([...localState.extent]) === JSON.stringify([...localState.planeState])) {
            setFullModel(true)
        }
        setLoading(true)

        setTotalBytes(0);
        setRawArray([])
        setLoading(true)

        var request = captureCameraInfo();
        var lodClient = client.getNewROILOD(request, {})

        lodClient.on('data', (response: any, err: any) => {
            if (firstStream) { // only get the total number of bytes in first stream message
                setLodNumBytes(response.getTotalLodBytes())  // Set the number of bytes in the LOD model to the new value
                setDimensionX(response.getDimensionsLodList()[0]) //Set new dimensions
                setDimensionY(response.getDimensionsLodList()[1])
                setDimensionZ(response.getDimensionsLodList()[2])
                console.log(response.getMaxPixel())
                setMinPixel(response.getMinPixel())
                setMaxPixel(response.getMaxPixel())
                setFirstStream(false)
            }

            setRawArray(rawArray => rawArray.concat(response.getBytes()))
            setTotalBytes(totalBytes => totalBytes + response.getNumBytes())
            if (err) {
                setLoading(false)
            }
        }
        )
    }

    const decode2DImage = () => { // We have to use webworkers, because h264decoder uses webassembly, and chrome does not allow heavy webassembly tasks on the main thread

        let rawArray = concatArrays(hqData) //Combine byte stream arrays
        const workerInstance = worker()
        let decodedArray = new Uint8Array()
        let rgbArray = new Uint8Array()

        workerInstance.addEventListener('message', (message: any) => { // listen for webworker messages
            if (message.data instanceof Array) {
                decodedArray = message.data[0];
                let width = message.data[1];
                let height = message.data[2];
                rgbArray = YUV2RBG(decodedArray, width, height) // Convert from Yuv to rgb
                render2DImage(height, width, rgbArray)
            }
        })

        workerInstance.decode(rawArray)
    }

    const render2DImage = (height: number, width: number, rgbArray: Uint8Array) => {
        console.log('Rendering 2d image')

        var scalars = vtkDataArray.newInstance({
            values: rgbArray,
            numberOfComponents: 3, // number of channels
            dataType: VtkDataTypes.UNSIGNED_CHAR, // values encoding
            name: 'scalars'
        });

        var imageData = vtkImageData.newInstance();
        imageData.setOrigin(0, 0, 0);
        imageData.setSpacing(1.0, 1.0, 1.0);
        imageData.setExtent(0, width - 1, 0, height - 1, 0, 0);
        imageData.getPointData().setScalars(scalars);

        var mapper = vtkImageMapper.newInstance();
        mapper.setInputData(imageData);

        var actor = vtkImageSlice.newInstance();
        actor.setMapper(mapper);

        var view3d = document.getElementById("view3d");

        view3d.addEventListener('mousedown', removeImage); // Switches to LOD on mouse click

        const sliceRenderer = vtkRenderer.newInstance({
            background: [255, 255, 255]
        });

        localState.setSliceRenderer(sliceRenderer)
        localState.sliceRenderer.addActor(actor);
        let bounds = [0, renderWindowLodRef.current.offsetWidth - 1, 0, renderWindowLodRef.current.offsetHeight - 1, 0, 0]
        localState.sliceRenderer.resetCameraNoOffset(bounds);
        console.log(bounds)
        localState.renderWindow.addRenderer(localState.sliceRenderer) // Overlay slice on top of volume after user stops interacting
        localState.renderWindow.render();
        setFirstStream(true);

    }

    const resetRenderItems = () => {

        if (localState.renderer) {
            var view3d = document.getElementById("view3d");

            view3d.removeEventListener('mouseup', debounceLog)
            view3d.removeEventListener('mousedown', removeImage)

            localState.openGlWindow.setContainer(null)
            localState.renderer.removeAllActors()
            localState.renderer.removeAllVolumes()
        }

        if (localState.sliceRenderer) {
            localState.sliceRenderer.removeAllActors()
            localState.sliceRenderer.removeAllVolumes()

        }
    }

    const renderDataCube = (arrayToRender: any, dimensions: any) => {
        setLoading(true)
        resetRenderItems()
        function createCube() {
            let width = dimensions[0]; let height = dimensions[1]; let depth = dimensions[2];

            const renderWindow = vtkRenderWindow.newInstance(); //Now uses RenderWindow instead of Fullscreen render window
            localState.setRenderWindow(renderWindow)

            var rawValues = concatArrays(arrayToRender)
            if (!cubeLoaded) {
                localState.setOriginalArray(arrayToRender)
                localState.setOriginalDimensions(dimensions)
            }
            var values = convertBlock(rawValues);
            var scalars = vtkDataArray.newInstance({
                values: values,
                numberOfComponents: 1, // number of channels (grayscale)
                dataType: VtkDataTypes.FLOAT, // values encoding
                name: 'scalars'
            });

            var imageData = vtkImageData.newInstance();
            imageData.setOrigin(0, 0, 0);
            imageData.setSpacing(1.0, 1.0, 1.0);
            localState.setPlaneState([0, width - 1, 0, height - 1, 0, depth - 1])
            imageData.setExtent([0, width - 1, 0, height - 1, 0, depth - 1]);
            imageData.getPointData().setScalars(scalars);

            localState.setExtent(imageData.getExtent());

            const cropFilter = vtkImageCropFilter.newInstance();
            var mapper = vtkVolumeMapper.newInstance();
            localState.setMapper(mapper)
            var volumeActor = vtkVolume.newInstance();
            localState.setVolumeActor(volumeActor)

            cropFilter.setInputData(imageData);
            localState.mapper.setInputConnection(cropFilter.getOutputPort())
            localState.mapper.setBlendModeToComposite();
            cropFilter.setCroppingPlanes(...imageData.getExtent())

            localState.volumeActor.setMapper(mapper);
            initProps(volumeActor.getProperty());

            var view3d = document.getElementById("view3d");

            view3d.addEventListener('mouseup', debounceLog);

            const renderer = vtkRenderer.newInstance({
                background: [255, 255, 255]
            });

            localState.setRenderer(renderer)

            localState.renderer.addVolume(localState.volumeActor);
            localState.renderer.getActiveCamera().elevation(30);

            localState.renderer.getActiveCamera().azimuth(45);
            localState.renderer.resetCamera();
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
            localState.setInteractor(interactor)
            interactor.setView(localState.openGlWindow);
            interactor.initialize();
            interactor.bindEvents(view3d);
            interactor.setInteractorStyle(vtkInteractorStyleTrackballCamera.newInstance());
            localState.setCropFilter(cropFilter)
            const widget = vtkImageCroppingRegionsWidget.newInstance();
            localState.setWidgetState(widget)

            localState.widget.setInteractor(interactor);

            localState.widget.setVolumeMapper(mapper);
            localState.widget.setHandleSize(10); // in pixels
            localState.widget.setEnabled(true);
            localState.widget.setCornerHandlesEnabled(true);
            localState.widget.setEdgeHandlesEnabled(true);
        }

        function initProps(property) {
            property.setRGBTransferFunction(0, newColorFunction());
            property.setScalarOpacity(0, newOpacityFunction());
            property.setInterpolationTypeToNearest();
            property.setUseGradientOpacity(0, false);

        }

        function newColorFunction() {
            console.log(Math.round(minPixel * 100) / 100)
            console.log(Math.round(maxPixel * 100) / 100)
            var fun = vtkColorTransferFunction.newInstance();
            localState.setColorTransferFunction(fun)
            fun.addRGBPoint(0.0, 0.0, 0.0, 0.0);
            fun.addRGBPoint(Math.round(maxPixel * 100) / 100, 1.0, 1.0, 1.0);
            return fun;
        }

        function newOpacityFunction() {
            var fun = vtkPiecewiseFunction.newInstance();
            fun.addPoint(0.0, 0.0);
            fun.addPoint(Math.round(maxPixel * 100) / 100, 1.0);
            return fun;
        }
        createCube();
        setLoading(false);
        setFirstStream(true);

        if (fullModel) {// check if the current cube is the full model
            localState.setOriginalArray(rawArray);
            localState.setOriginalDimensions([dimensionX, dimensionY, dimensionZ]);
            localState.setOldLodSize(localState.lodMemorySize);
            setFullModel(false);
        }
    }

    const onFileChosen = (filename: any) => {
        setFileName(filename)
        if (filename === null || filename === '') {
            setLoading(false)
        }
    }

    const renderFile = () => {
        setLoading(true)

        var request = new FileDetails();
        request.setFileName(filename);
        request.setSMethod(0); //Default to max
        var renderFileClient = client.chooseFile(request, {})
        request.setTargetSizeLodBytes(localState.lodMemorySize); //Set the LOD memory size to the size selected
        renderFileClient.on('data', (response: any, err: any) => {
            if (err) {
                console.log(err)
            }
            if (firstStream) {
                setLodNumBytes(response.getTotalLodBytes())
                setMinPixel(response.getMinPixel())
                setMaxPixel(response.getMaxPixel())
                let dimensionsArray = response.getDimensionsLodList()
                setDimensionX(dimensionsArray[0])
                setDimensionY(dimensionsArray[1])
                setDimensionZ(dimensionsArray[2])

                setFirstStream(false)
            }

            setRawArray(rawArray => rawArray.concat(response.getBytes()))
            setTotalBytes(totalBytes => totalBytes + response.getNumBytes())


        })
    }

    const captureCameraInfo = () => {

        const request = new CameraInfo();
        const positionList = localState.renderer.getActiveCamera().getPosition()
        const focalPointList = localState.renderer.getActiveCamera().getFocalPoint()
        widthRef.current = renderWindowLodRef.current.offsetWidth
        heightRef.current = renderWindowLodRef.current.offsetHeight
        const viewUpList = localState.renderer.getActiveCamera().getViewUp()
        const distance = localState.renderer.getActiveCamera().getDistance()
        const rgba = [localState.colorTransferFunction.getRedValue(0), localState.colorTransferFunction.getGreenValue(0), localState.colorTransferFunction.getBlueValue(0)]
        const alpha = localState.colorTransferFunction.getAlpha();
        const croppingPlanes = localState.planeState;
        let uniqueId = uuidv4();
        localState.setCurrentUuid(uniqueId);

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
        request.setSMethod(localState.sampleType)
        request.setUuid(uniqueId)

        console.log("Position: " + positionList)
        console.log("Focal point: " + focalPointList)
        console.log("Width: " + widthRef.current)
        console.log("Height: " + heightRef.current)
        console.log("ViewUp: " + viewUpList)
        console.log("Distance: " + distance)
        console.log("rgb: " + rgba)
        console.log("Alpha: " + alpha)
        console.log("Cropping planes: " + localState.cropFilter.getCroppingPlanes())
        console.log("Sample Type: " + localState.sampleType)
        console.log("Uuid "  + uuid)

        return request

    }


    const debounceLog = useCallback(debounce(() => {
        setTotalHqBytes(0)
        setHqData([])
        console.log('Receiving HQ model')

        var request = captureCameraInfo()
        var renderClient = client.getHQRender(request, {})
        renderClient.on('data', (response: any, err: any) => {
            if (response) {
                if (response.getUuid() !== localState.currentUuid) {
                    console.log('Stale image, do not use')
                }
                else {
                    if (firstStream) {
                        setHqNumBytes(response.getSizeInBytes())
                        setFirstStream(false)
                    }
                    setHqData(hqData => hqData.concat(response.getBytes()))
                    setTotalHqBytes(totalHqBytes => totalHqBytes + response.getNumBytes())
                }
            };
            if (err) {
                console.log(err)
            }
        })
    }, 300), [])



    const requestFiles = () => {
        var request = new FilesRequest();
        request.setUselessMessage("This is a useless message");
        client.listFiles(request, {}).then((response: any) => setFileNames(response.getFilesList())).catch((err: any) => { console.log(err) });
    }

    const resetCube = () => {
        var request = new CameraInfo();
        request.setTargetSizeLodBytes(localState.oldLodSize)
        client.reset(request, {})
        localState.setLodMemorySize(localState.oldLodSize)
        renderDataCube(localState.originalArray, localState.originalDimensions)
    }

    const handleAlignChange = (align: any) => {
        if (align === Alignment.LEFT) {
            localState.setSampleType(0)
        } else if (align === Alignment.RIGHT) {
            localState.setSampleType(1)
        }
        console.log(align);
        setAlignIndicator(align);
        getNewLodModel()
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
            <div className={'loading-div'}>
                {loading &&
                    <img src={logo} className="App-logo" alt="logo" />
                }
                {cubeLoaded &&
                    <AlignmentSelect
                        align={alignIndicator}
                        allowCenter={false}
                        label="Sample Type"
                        onChange={(align: any) => handleAlignChange(align)}
                    />
                }
            </div>

            <div className={classNames('rendering-window', 'row')} id="view3d" ref={renderWindowLodRef}>
                {/* Rendering happens in this div */}

            </div>

            <div className="fixed-bottom bg-dark h-25 justify-content-center row" >

                <div className={"d-flex col col-lg-2 mt-4"}>
                    {cubeLoaded &&
                        <div>
                            <div className={"mb-3"}>
                                <LodSizeSlider localState={localState} />
                                <button className="btn btn-success mt-2" onClick={getNewLodModel}>Request new model</button>
                            </div>
                            <div className={""}>
                                {cubeLoaded && <button className="btn btn-outline-secondary text-white " onClick={resetCube}>Reset cropping area</button>}
                            </div>
                        </div>
                    }
                </div>
                <div className={"d-flex col col-lg-7 mt-4"}>
                    {cubeLoaded && <AxisSlider localState={localState} />}
                </div>

                <div className={"col col-lg-2"}>
                    {cubeLoaded && <TransferFunctionSlider localState={localState} />}
                </div>


            </div>
        </div>
    );

})

export default App