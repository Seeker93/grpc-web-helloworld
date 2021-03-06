import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FileSelector } from './components/FileSelector'
import { AxisSlider } from './components/AxisSlider'

import { LodSizeSlider } from './components/LodSizeSlider'
import { AlignmentSelect } from "./components/AlignmentSelect";
import { Alignment } from "@blueprintjs/core";
import './App.css';

import vtkPiecewiseGaussianWidget from 'vtk.js/Sources/Interaction/Widgets/PiecewiseGaussianWidget';
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
import { debounce, YUV2RBG, byteArrayToFloatArray, concatArrays } from './utils/helperFunctions'

import classNames from 'classnames/bind';

const worker = require('workerize-loader!./worker'); // eslint-disable-line import/no-webpack-loader-syntax
const { FileDetails, FilesRequest, CameraInfo } = require('./voxualize-protos/voxualize_pb.js');
const { GreeterPromiseClient } = require('./voxualize-protos/voxualize_grpc_web_pb.js');

const App = observer(() => {
    const localState = useLocalStore(() => ({ //Mobx local store. Same as react state, but with observable properties
        widget: null,
        planeState: null,
        cropFilter: null,
        renderer: null,
        renderWindow: null,
        volumeActor: null,
        colorTransferFunction: null,
        pieceWiseFunction: null,
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
        colorWidget: null,
        scalars: null,
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
        setPiecewiseFunction(fun: any) {
            localState.pieceWiseFunction = fun;
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
        },
        setColorWidget(widget: any) {
            localState.colorWidget = widget;
        },
        setScalars(scalars: any) {
            localState.scalars = scalars;
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
    const [errorMessage, setErrorMessage] = useState('')
    const [alignIndicator, setAlignIndicator] = useState(Alignment.LEFT);
    const renderWindowLodRef = useRef(null);

    const widthRef = useRef(0);
    const heightRef = useRef(0);

    var client = new GreeterPromiseClient('http://' + window.location.hostname + ':8080', null, null);

    useEffect(() => {
        if (totalBytes > 0 && totalBytes === lodNumBytes) {
            setCubeLoaded(true)
            renderDataCube(rawArray, [dimensionX, dimensionY, dimensionZ])
            setTotalBytes(0);
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

    // Removes image when user interacts with it.
    // Usecallback makes sure that all signatures of this same method are the same
    const removeImage = useCallback(() => {
        if (localState.renderWindow) {
            localState.renderWindow.removeRenderer(localState.sliceRenderer) // Remove slice when the user clicks the static image
        }
    }, [])

    // Called when the user requests a higher / lower res LOD model
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

        lodClient.on('data', (response: any) => {
            if (firstStream) { // only get the total number of bytes in first stream message
                setLodNumBytes(response.getTotalLodBytes())  // Set the number of bytes in the LOD model to the new value
                setDimensionX(response.getDimensionsLodList()[0]) //Set new dimensions
                setDimensionY(response.getDimensionsLodList()[1])
                setDimensionZ(response.getDimensionsLodList()[2])
                setMinPixel(response.getMinPixel())
                setMaxPixel(response.getMaxPixel())
                setFirstStream(false)
            }

            setRawArray(rawArray => rawArray.concat(response.getBytes()))
            setTotalBytes(totalBytes => totalBytes + response.getNumBytes())
        }
        )
        lodClient.on('error', (err: any) => {
            setLoading(false)
            timedErrorMessage('Error while fetching new LOD model')
        })
    }

    // Decodes 2D image.
    // We have to use webworkers, because h264decoder uses webassembly, and chrome does not allow heavy webassembly tasks on the main thread
    const decode2DImage = () => {
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


    //Renders 2D high quality image
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
        localState.sliceRenderer.resetCameraNoOffset(bounds, 400 * 1.86);
        localState.renderWindow.addRenderer(localState.sliceRenderer) // Overlay slice on top of volume after user stops interacting
        localState.renderWindow.render();
        setFirstStream(true);

    }

    // Resets render windows when render is called again.
    const resetRenderItems = () => {

        if (localState.renderer) {
            var view3d = document.getElementById("view3d");
            view3d.removeEventListener('mouseup', debounceLog)
            view3d.removeEventListener('mousedown', removeImage)
            view3d.removeEventListener('resize', resizeWindow)
            localState.openGlWindow.setContainer(null)
            localState.renderer.removeAllActors()
            localState.renderer.removeAllVolumes()
        }

        if (localState.sliceRenderer) {
            localState.sliceRenderer.removeAllActors()
            localState.sliceRenderer.removeAllVolumes()
        }

        if (localState.colorWidget) {
            localState.colorWidget.setContainer(null)
        }
    }

    // Resizes render window when the window is resized to make actors stay a sensible size
    const resizeWindow = () => {
        var view3d = document.getElementById("view3d");
        const dims = view3d.getBoundingClientRect();
        localState.openGlWindow.setSize(dims.width, dims.height)
        localState.renderWindow.render()
    }

    //  Renders LOD model
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
            var values = byteArrayToFloatArray(rawValues);
            var scalars = vtkDataArray.newInstance({
                values: values,
                numberOfComponents: 1, // number of channels (grayscale)
                dataType: VtkDataTypes.FLOAT, // values encoding
                name: 'scalars'
            });
            localState.setScalars(scalars)

            var imageData = vtkImageData.newInstance();
            imageData.setOrigin(0, 0, 0);
            imageData.setSpacing(1.0, 1.0, 1.0);
            localState.setPlaneState([0, width - 1, 0, height - 1, 0, depth - 1])
            imageData.setExtent([0, width - 1, 0, height - 1, 0, depth - 1]);
            imageData.getPointData().setScalars(scalars);

            const piecewiseFunction = vtkPiecewiseFunction.newInstance();
            localState.setPiecewiseFunction(piecewiseFunction)
            const lookupTable = vtkColorTransferFunction.newInstance();
            localState.setColorTransferFunction(lookupTable)

            var view3d = document.getElementById("view3d");

            view3d.addEventListener('mouseup', debounceLog);
            window.addEventListener('resize', resizeWindow);
            initOpacityWidget()

            localState.setExtent(imageData.getExtent());

            const cropFilter = vtkImageCropFilter.newInstance();
            var mapper = vtkVolumeMapper.newInstance();
            localState.setMapper(mapper)
            var volumeActor = vtkVolume.newInstance();
            localState.setVolumeActor(volumeActor)

            initTransferFunctionProps(localState.volumeActor.getProperty());

            localState.volumeActor.getProperty().setRGBTransferFunction(0, localState.colorTransferFunction);
            localState.volumeActor.getProperty().setScalarOpacity(0, localState.pieceWiseFunction);
            localState.volumeActor.getProperty().setInterpolationTypeToNearest();
            cropFilter.setInputData(imageData);
            localState.mapper.setInputConnection(cropFilter.getOutputPort())
            localState.mapper.setBlendModeToComposite();
            cropFilter.setCroppingPlanes(...imageData.getExtent())

            localState.volumeActor.setMapper(mapper);

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

    const defaultColorFunction = () => {
        localState.colorTransferFunction.addRGBPoint(0.0, 0.0, 0.0, 0.0);
        localState.colorTransferFunction.addRGBPoint(Math.round(maxPixel * 100) / 100, 1.0, 1.0, 1.0);
        return localState.colorTransferFunction;
    }

    const defaultOpacityFunction = () => {
        localState.pieceWiseFunction.addPoint(0.0, 0.0);
        localState.pieceWiseFunction.addPoint(Math.round(maxPixel * 100) / 100, 1.0);
        return localState.pieceWiseFunction;
    }

    const initTransferFunctionProps = (property: any) => {
        property.setRGBTransferFunction(0, defaultColorFunction());
        property.setScalarOpacity(0, defaultOpacityFunction());
        property.setUseGradientOpacity(0, false);
    }

    const initOpacityWidget = () => {
        if (localState.colorWidget) {
            localState.colorWidget.setContainer(null)
        }
        const colorWidget = vtkPiecewiseGaussianWidget.newInstance({
            numberOfBins: Math.ceil(maxPixel - minPixel + 1) * 5,
            size: [420, 120],
        });
        localState.setColorWidget(colorWidget);

        localState.colorWidget.updateStyle({
            backgroundColor: 'rgba(255, 255, 255, 0.6)',
            histogramColor: 'rgba(100, 100, 100, 0.5)',
            strokeColor: 'rgb(0, 0, 0)',
            activeColor: 'rgb(255, 255, 255)',
            handleColor: 'rgb(50, 150, 50)',
            buttonDisableFillColor: 'rgba(255, 255, 255, 0.5)',
            buttonDisableStrokeColor: 'rgba(0, 0, 0, 0.5)',
            buttonStrokeColor: 'rgba(0, 0, 0, 1)',
            buttonFillColor: 'rgba(255, 255, 255, 1)',
            strokeWidth: 2,
            activeStrokeWidth: 3,
            buttonStrokeWidth: 1.5,
            handleWidth: 3,
            iconSize: 20,
            padding: 10,
        });

        const widgetContainer = document.getElementById("widgetContainer");;
        widgetContainer.style.background = 'rgba(255, 255, 255, 0.3)';
        widgetContainer.style.width = '100%';
        localState.colorWidget.setContainer(widgetContainer);

        localState.colorWidget.setDataArray(localState.scalars.getData());
        localState.colorWidget.applyOpacity(localState.pieceWiseFunction);
        localState.colorWidget.addGaussian(Math.round(maxPixel * 100), 1, 1, 1, 1);

        localState.colorWidget.setColorTransferFunction(localState.colorTransferFunction);
        localState.colorTransferFunction.onModified(() => {
            localState.colorWidget.render();
            localState.renderWindow.render();
        });
        localState.colorWidget.onOpacityChange(() => {
            removeImage()
            console.log(localState.pieceWiseFunction.getDataPointer())
            localState.colorWidget.applyOpacity(localState.pieceWiseFunction);
            if (!localState.renderWindow.getInteractor().isAnimating()) {
                localState.renderWindow.render();
            }
        });

        localState.colorWidget.bindMouseListeners();
        localState.colorWidget.onAnimation((start) => {
            if (start) {
                localState.renderWindow.getInteractor().requestAnimation(localState.widget);
            } else {
                localState.renderWindow.getInteractor().cancelAnimation(localState.widget);
            }
        });

    }

    //Request list of files on server
    const requestFiles = () => {
        var request = new FilesRequest();
        request.setUselessMessage("This is a useless message");
        client.listFiles(request, {}).then((response: any) => setFileNames(response.getFilesList())).catch((err: any) => { console.log(err) });
    }

    // Called when data file is selected
    const onFileChosen = (filename: any) => {
        setFileName(filename)
        if (filename === null || filename === '') {
            setLoading(false)
        }
    }

    const timedErrorMessage = (message: string) => {
        setErrorMessage(message)
        setTimeout(() => { setErrorMessage('') }, 8000) // Message displays for 8 seconds
    }

    // Calls rpc that receives LOD byte data
    const renderFile = () => {
        setLoading(true)
        setRawArray([])
        var request = new FileDetails();
        request.setFileName(filename);
        var renderFileClient = client.chooseFile(request, {})
        request.setTargetSizeLodBytes(localState.lodMemorySize); //Set the LOD memory size to the size selected
        renderFileClient.on('data', (response: any) => {
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
        renderFileClient.on('error', (err: any) => {
            setLoading(false)
            if (err.code === 14) {
                timedErrorMessage('Server disconnected');
            }
            console.log(`Unexpected stream error: code = ${err.code}` +
                `, message = "${err.message}"`);
        });
    }

    // Captures current orientation of LOD cube
    const captureCameraInfo = () => {
        const request = new CameraInfo();
        const positionList = localState.renderer.getActiveCamera().getPosition()
        const focalPointList = localState.renderer.getActiveCamera().getFocalPoint()
        widthRef.current = renderWindowLodRef.current.offsetWidth
        heightRef.current = renderWindowLodRef.current.offsetHeight

        let windowWidth = widthRef.current % 2 === 0 ? widthRef.current : widthRef.current + 1; // Force even number
        let windowHeight = heightRef.current % 2 === 0 ? heightRef.current : heightRef.current + 1;

        const viewUpList = localState.renderer.getActiveCamera().getViewUp()
        const distance = localState.renderer.getActiveCamera().getDistance()
        let opacityArray = localState.pieceWiseFunction.getDataPointer()
        const rgba = [0, 0, 0, 0]
        const croppingPlanes = localState.planeState;
        let uniqueId = uuidv4();
        localState.setCurrentUuid(uniqueId);

        request.setTargetSizeLodBytes(localState.lodMemorySize);
        request.setCroppingPlanesList(croppingPlanes)
        request.setRgbaList(rgba)
        request.setAlpha(1)
        request.setPositionList(positionList)
        request.setFocalPointList(focalPointList)
        request.setWindowWidth(windowWidth)
        request.setWindowHeight(windowHeight)
        request.setViewUpList(viewUpList)
        request.setDistance(distance)
        request.setSMethod(localState.sampleType)
        request.setUuid(uniqueId)

        request.setOpacityArrayList(opacityArray)
        console.log("Position: " + positionList)
        console.log("Focal point: " + focalPointList)
        console.log("Width: " + widthRef.current)
        console.log("Height: " + heightRef.current)
        console.log("ViewUp: " + viewUpList)
        console.log("Distance: " + distance)
        console.log("Cropping planes: " + localState.cropFilter.getCroppingPlanes())
        console.log("Sample Type: " + localState.sampleType)
        console.log("Uuid " + uniqueId)

        return request
    }

    // Called whenever the user stops interacting with the cube (after 300ms)
    const debounceLog = useCallback(debounce(() => {
        setTotalHqBytes(0)
        setHqData([])
        console.log('Receiving HQ model')

        var request = captureCameraInfo()
        var renderClient = client.getHQRender(request, {})
        renderClient.on('data', (response: any) => {
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
        })

        renderClient.on('error', (error: any) => {
            setLoading(false)
            timedErrorMessage("Error while fetching HQ image")
        })
    }, 300), [])

    // Resets cube to it's original state
    const resetCube = () => {
        var request = new CameraInfo();
        request.setTargetSizeLodBytes(localState.oldLodSize)
        client.reset(request, {})
        localState.setLodMemorySize(localState.oldLodSize)
        renderDataCube(localState.originalArray, localState.originalDimensions)
    }

    // Handle sampling method
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

    // Resets opacity transfer function values
    const resetOpacity = () => {
        removeImage()
        initOpacityWidget()
        localState.colorTransferFunction.removeAllPoints();
        localState.pieceWiseFunction.removeAllPoints();
        initTransferFunctionProps(localState.volumeActor.getProperty())
        localState.renderWindow.render()
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
                {errorMessage !== '' &&
                    <h6 className="text-danger mt-3">{errorMessage}</h6>
                }
                {loading &&
                    <img src={logo} className="App-logo" alt="logo" />
                }
                {cubeLoaded &&
                    <div className={"row"}>
                        <div className={"col mt-3 ml-2"}>
                            <p className={"col col-sm mr-2 text-dark"}>Downsampling method</p>
                            <AlignmentSelect
                                align={alignIndicator}
                                allowCenter={false}
                                onChange={(align: any) => handleAlignChange(align)}
                            />
                        </div>
                    </div>
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
                            </div>
                            <div className={"row"}>
                                <button className="btn btn-success btn-sm mt-3 col col-sm mr-1" onClick={getNewLodModel}>Request new model</button>
                                {cubeLoaded && <button className="btn btn-outline-secondary btn-sm text-white col col-sm mt-3 ml-1" onClick={resetCube}>Reset cropping area</button>}
                            </div>
                        </div>
                    }
                </div>
                <div className={"d-flex col col-lg-5 mt-4"}>
                    {cubeLoaded && <AxisSlider localState={localState} />}
                </div>
                <div className="d-flex flex-column col col-lg-4 my-auto">
                    <div id="widgetContainer" className={"pt-2"}>
                    </div>
                    {cubeLoaded && <button className="btn btn-sm btn-outline-secondary text-white " onClick={resetOpacity}>Reset opacity</button>}
                </div>
            </div>
        </div >
    );

})

export default App