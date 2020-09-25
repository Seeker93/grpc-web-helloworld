
import React, { useState, useEffect } from 'react'
import { Slider } from "@blueprintjs/core";
import { observer } from 'mobx-react'
import './AxisSlider.css';

export const AxisSlider = observer((props: any) => {
    const { localState } = props

    const [nxValue, setnxValue] = useState(localState.planeState[0])
    const [xValue, setxValue] = useState(localState.planeState[1])
    const [nyValue, setnyValue] = useState(localState.planeState[2])
    const [yValue, setyValue] = useState(localState.planeState[3])
    const [nzValue, setnzValue] = useState(localState.planeState[4])
    const [zValue, setzValue] = useState(localState.planeState[5])

    localState.widget.onCroppingPlanesChanged((planes: any) => { onWidgetChanged(planes) })

    useEffect(() => {
        setnxValue(localState.planeState[0])
        setxValue(localState.planeState[1])
        setnyValue(localState.planeState[2])
        setyValue(localState.planeState[3])
        setnzValue(localState.planeState[4])
        setzValue(localState.planeState[5])
    }, [localState.cubeReset]);


    const onWidgetChanged = (planes: number[]) => {
        localState.cropFilter.setCroppingPlanes(planes)
        if (planes[0] > localState.extent[0] && planes[0] < localState.extent[1]) {
            setnxValue(localState.widget.getCroppingPlanes()[0])
        }
        if (planes[1] > localState.extent[0] && planes[1] < localState.extent[1]) {
            setxValue(localState.widget.getCroppingPlanes()[1])
        }
        if (planes[2] > localState.extent[2] && planes[2] < localState.extent[3]) {
            setnyValue(localState.widget.getCroppingPlanes()[2])
        }
        if (planes[3] > localState.extent[2] && planes[3] < localState.extent[3]) {
            setyValue(localState.widget.getCroppingPlanes()[3])
        }
        if (planes[4] > localState.extent[4] && planes[4] < localState.extent[5]) {
            setnzValue(localState.widget.getCroppingPlanes()[4])
        }
        if (planes[5] > localState.extent[4] && planes[5] < localState.extent[5]) {
            setzValue(localState.widget.getCroppingPlanes()[5])
        }

    }

    const onCoordChange = (value: number, index: number) => {
        localState.flipAxesChanged()
        let newPlaneArray = localState.planeState
        newPlaneArray[index] = value
        localState.widget.setCroppingPlanes(...newPlaneArray)
        localState.cropFilter.setCroppingPlanes(newPlaneArray)
    }

    const onSliderRelease = () =>{
        localState.flipAxesReleased()
    }

    return (
        <div className={"slider"}>
            <div className="row">
                <h6 className="label text-white">I:</h6>
                <div className={"col-sm-5 text-white flex-start mr-4"}>
                    <Slider
                        min={localState.extent[0]}
                        max={localState.extent[1]}
                        stepSize={0.1}
                        value={nxValue}
                        labelPrecision={0}
                        labelStepSize={localState.extent[1]}
                        onRelease={onSliderRelease}
                        onChange={(value: number) => onCoordChange(value, 0)}
                        vertical={false}
                    />
                </div>
                <div className={"col-sm-5 text-white flex-end"}>

                    <Slider
                        min={localState.extent[0]}
                        max={localState.extent[1]}
                        stepSize={0.1}
                        value={xValue}
                        labelPrecision={0}
                        labelStepSize={localState.extent[1]}
                        className={"col-xs-6 text-white"}
                        onRelease={onSliderRelease}
                        onChange={(value: number) => onCoordChange(value, 1)}
                        vertical={false}
                    />
                </div>
            </div>
            <div className="row">
                <h6 className="label text-white">J:</h6>

                <div className={"col-sm-5 text-white flex-start mr-4"}>

                    <Slider
                        min={localState.extent[2]}
                        max={localState.extent[3]}
                        labelPrecision={0}
                        labelStepSize={localState.extent[3]}
                        stepSize={0.1}
                        value={nyValue}
                        onRelease={onSliderRelease}
                        onChange={(value: number) => onCoordChange(value, 2)}
                        vertical={false}
                    />
                </div>
                <div className={"col-sm-5 text-white flex-end"}>

                    <Slider
                        min={localState.extent[2]}
                        max={localState.extent[3]}
                        labelPrecision={0}
                        labelStepSize={localState.extent[3]}
                        stepSize={0.1}
                        value={yValue}
                        onRelease={onSliderRelease}
                        onChange={(value: number) => onCoordChange(value, 3)}
                        vertical={false}
                    />
                </div>
            </div>
            <div className="row">
                <h6 className="label text-white">K:</h6>
                <div className={"col-sm-5 text-white flex-start mr-4"}>

                    <Slider
                        min={localState.extent[4]}
                        max={localState.extent[5]}
                        stepSize={0.1}
                        value={nzValue}
                        labelPrecision={0}
                        labelStepSize={localState.extent[5]}
                        onRelease={onSliderRelease}
                        onChange={(value: number) => onCoordChange(value, 4)}
                        vertical={false}
                    />
                </div>
                <div className={"col-sm-5 text-white flex-end"}>

                    <Slider
                        min={localState.extent[4]}
                        max={localState.extent[5]}
                        stepSize={0.1}
                        value={zValue}
                        labelPrecision={0}
                        labelStepSize={localState.extent[5]}
                        onRelease={onSliderRelease}
                        onChange={(value: number) => onCoordChange(value, 5)}
                        vertical={false}
                    />
                </div>
            </div>
        </div>
    );

})