
import React, { useState, useEffect } from 'react'
import { Slider } from "@blueprintjs/core";
import { observer } from 'mobx-react'
import './AxisSlider.css';

export const AxisSlider = observer((props: any) => {
    const { extent, localState } = props

    const [nxValue, setnxValue] = useState(localState.planeState[0])
    const [xValue, setxValue] = useState(localState.planeState[1])
    const [nyValue, setnyValue] = useState(localState.planeState[2])
    const [yValue, setyValue] = useState(localState.planeState[3])
    const [nzValue, setnzValue] = useState(localState.planeState[4])
    const [zValue, setzValue] = useState(localState.planeState[5])

    localState.widget.onCroppingPlanesChanged((planes: any) => { onWidgetChanged(planes) })


    const onWidgetChanged = (planes: number[]) => {
        localState.cropFilter.setCroppingPlanes(planes)
        if (planes[0] > extent[0] && planes[0] < extent[1]) {
            setnxValue(localState.widget.getCroppingPlanes()[0])
        }
        if (planes[1] > extent[0] && planes[1] < extent[1]) {
            setxValue(localState.widget.getCroppingPlanes()[1])
        }
        if (planes[2] > extent[2] && planes[2] < extent[3]) {
            setnyValue(localState.widget.getCroppingPlanes()[2])
        }
        if (planes[3] > extent[2] && planes[3] < extent[3]) {
            setyValue(localState.widget.getCroppingPlanes()[3])
        }
        if (planes[4] > extent[4] && planes[4] < extent[5]) {
            setnzValue(localState.widget.getCroppingPlanes()[4])
        }
        if (planes[5] > extent[4] && planes[5] < extent[5]) {
            setzValue(localState.widget.getCroppingPlanes()[5])
        }

    }

    const onCoordChange = (value: number, index: number) => {
        let newPlaneArray = localState.planeState
        newPlaneArray[index] = value
        localState.widget.setCroppingPlanes(...newPlaneArray)
        localState.cropFilter.setCroppingPlanes(newPlaneArray)
    }

    return (
        <div className={"slider pt-4"}>
            <h5 className="text-light">Adjust Axes</h5>
            <div className="row">
                <h6 className="text-light pr-4">I:</h6>
                <div className={"col-sm-5 text-white flex-start pr-4"}>
                    <Slider
                        min={extent[0]}
                        max={extent[1]}
                        stepSize={0.1}
                        value={nxValue}
                        labelPrecision={0}
                        labelStepSize={extent[1]}
                        onChange={(value: number) => onCoordChange(value, 0)}
                        vertical={false}
                    />
                </div>
                <div className={"col-sm-5 text-white flex-end"}>

                    <Slider
                        min={extent[0]}
                        max={extent[1]}
                        stepSize={0.1}
                        value={xValue}
                        labelPrecision={0}
                        labelStepSize={extent[1]}
                        className={"col-xs-6 text-white"}
                        onChange={(value: number) => onCoordChange(value, 1)}
                        vertical={false}
                    />
                </div>
            </div>
            <div className="row">
                <h6 className="text-light pr-4">J:</h6>

                <div className={"col-sm-5 text-white flex-start pr-4"}>

                    <Slider
                        min={extent[2]}
                        max={extent[3]}
                        labelPrecision={0}
                        labelStepSize={extent[3]}
                        stepSize={0.1}
                        value={nyValue}
                        onChange={(value: number) => onCoordChange(value, 2)}
                        vertical={false}
                    />
                </div>
                <div className={"col-sm-5 text-white flex-end"}>

                    <Slider
                        min={extent[2]}
                        max={extent[3]}
                        labelPrecision={0}
                        labelStepSize={extent[3]}
                        stepSize={0.1}
                        value={yValue}
                        onChange={(value: number) => onCoordChange(value, 3)}
                        vertical={false}
                    />
                </div>
            </div>
            <div className="row">
                <h6 className="text-light pr-4">K:</h6>
                <div className={"col-sm-5 text-white flex-start pr-4"}>

                    <Slider
                        min={extent[4]}
                        max={extent[5]}
                        stepSize={0.1}
                        value={nzValue}
                        labelPrecision={0}
                        labelStepSize={extent[5]}
                        onChange={(value: number) => onCoordChange(value, 4)}
                        vertical={false}
                    />
                </div>
                <div className={"col-sm-5 text-white flex-end"}>

                    <Slider
                        min={extent[4]}
                        max={extent[5]}
                        stepSize={0.1}
                        value={zValue}
                        labelPrecision={0}
                        labelStepSize={extent[5]}
                        onChange={(value: number) => onCoordChange(value, 5)}
                        vertical={false}
                    />
                </div>
            </div>
        </div>
    );

})