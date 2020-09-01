
import React, { useState } from 'react'
import { Slider } from "@blueprintjs/core";

export function AxisSlider(props: any) {
    const { extent, planeArray, widget, onPlanesChanged } = props

    const [xValue, setxValue] = useState(planeArray[1])
    const [yValue, setyValue] = useState(planeArray[3])
    const [zValue, setzValue] = useState(planeArray[5])



    const onxRelease = async (xvalue: number) => {
        let newPlaneArray = planeArray
        newPlaneArray[1] = xvalue
        widget.setCroppingPlanes(...newPlaneArray)
        widget.updateRepresentation();
    }

    const onyRelease = (yvalue: number) => {
        let newPlaneArray = planeArray
        newPlaneArray[3] = yvalue
        widget.setCroppingPlanes(...newPlaneArray)
        widget.updateRepresentation();
    }

    const onzRelease = (zvalue: number) => {
        let newPlaneArray = planeArray
        newPlaneArray[5] = zvalue
        widget.setCroppingPlanes(...newPlaneArray)
        widget.updateRepresentation();
    }


    return (
        <div className={"px-3 pt-5"}>
            <h5 className="text-light">Adjust Axes</h5>
            <Slider
                min={extent[0]}
                max={extent[1]}
                stepSize={0.1}
                labelStepSize={extent[1]}
                value={xValue}
                className={"text-white"}
                onRelease={(value: number) => { onxRelease(value) }}
                onChange={(value: number) => setxValue(value)}
                vertical={false}
            />
            <Slider
                min={extent[2]}
                max={extent[3]}
                stepSize={0.1}

                labelStepSize={extent[3]}
                value={yValue}
                className={"text-white"}
                onRelease={(value: number) => { onyRelease(value) }}
                onChange={(value: number) => setyValue(value)}
                vertical={false}
            />
            <Slider
                min={extent[4]}
                max={extent[5]}
                stepSize={0.1}
                labelStepSize={extent[5]}
                value={zValue}
                className={"text-white"}
                onRelease={(value: number) => { onzRelease(value) }}
                onChange={(value: number) => setzValue(value)}
                vertical={false}
            />
        </div>
    );

}