
import React, { useState, useEffect } from 'react'
import { Slider } from "@blueprintjs/core";
import { observer } from 'mobx-react'
import './AxisSlider.css';

export const AxisSlider = observer((props: any) => {
    const { localState } = props


    localState.widget.onCroppingPlanesChanged((planes: any) => { onWidgetChanged(planes) })



    const onWidgetChanged = (planes: number[]) => {
        localState.cropFilter.setCroppingPlanes(planes)
        if (planes[0] > localState.extent[0] && planes[0] < localState.extent[1]) {
            let newArray = localState.planeState;
            newArray[0] = localState.widget.getCroppingPlanes()[0]
            localState.setPlaneState(newArray)
        }
        if (planes[1] > localState.extent[0] && planes[1] < localState.extent[1]) {
            let newArray = localState.planeState;
            newArray[1] = localState.widget.getCroppingPlanes()[1]
            localState.setPlaneState(newArray)
        }
        if (planes[2] > localState.extent[2] && planes[2] < localState.extent[3]) {
            let newArray = localState.planeState;
            newArray[2] = localState.widget.getCroppingPlanes()[2]
            localState.setPlaneState(newArray)
        }
        if (planes[3] > localState.extent[2] && planes[3] < localState.extent[3]) {
            let newArray = localState.planeState;
            newArray[3] = localState.widget.getCroppingPlanes()[3]
            localState.setPlaneState(newArray)
        }
        if (planes[4] > localState.extent[4] && planes[4] < localState.extent[5]) {
            let newArray = localState.planeState;
            newArray[4] = localState.widget.getCroppingPlanes()[4]
            localState.setPlaneState(newArray)
        }
        if (planes[5] > localState.extent[4] && planes[5] < localState.extent[5]) {
            let newArray = localState.planeState;
            newArray[5] = localState.widget.getCroppingPlanes()[5]
            localState.setPlaneState(newArray)
        }

    }

    const onCoordChange = (value: number, index: number) => {
        localState.flipAxesChanged()
        let newPlaneArray = localState.planeState
        newPlaneArray[index] = value
        localState.widget.setCroppingPlanes(...newPlaneArray)
        localState.cropFilter.setCroppingPlanes(newPlaneArray)
        localState.setPlaneState(newPlaneArray)
    }

    const onSliderRelease = () => {
        localState.flipAxesReleased()
    }

    return (
        <div className={"slider"}>
            <h5 className="text-light">Adjust Axes</h5>

            <div className="row">
                <h6 className="label text-white">I:</h6>
                <div className={"col-sm-5 text-white flex-start mr-4"}>
                    <Slider
                        min={localState.extent[0]}
                        max={localState.extent[1]}
                        stepSize={0.1}
                        value={localState.planeState[0]}
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
                        value={localState.planeState[1]}
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
                        value={localState.planeState[2]}
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
                        value={localState.planeState[3]}
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
                        value={localState.planeState[4]}
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
                        value={localState.planeState[5]}
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