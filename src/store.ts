import { useLocalStore } from 'mobx-react'

export const localState = useLocalStore(() => ({
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