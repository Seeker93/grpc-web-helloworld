
import React, { useState, useEffect } from 'react'
import { Slider } from "@blueprintjs/core";
import { observer } from 'mobx-react'

export const TransferFunctionSlider = observer((props: any) => {
    const { localState } = props

    const [red, setRed] = useState(0.0)
    const [green, setGreen] = useState(0.0)
    const [blue, setBlue] = useState(0.0)
    // const [opacity, setOpacity] = useState(0)

    const onRedChange = (value: number) => {
        setRed(value)
        localState.volumeActor.getProperty().setRGBTransferFunction(0, newColorFunction());
        console.log(localState.volumeActor.getProperty().getRGBTransferFunction(0))
        localState.renderWindow.render()
    }

    const onGreenChange = (value: number) => {
        setGreen(value)
        localState.volumeActor.getProperty().setRGBTransferFunction(0, newColorFunction());
        localState.renderWindow.render()
    }

    const onBlueChange = (value: number) => {
        setBlue(value)
        localState.volumeActor.getProperty().setRGBTransferFunction(0, newColorFunction());
        localState.renderWindow.render()
    }
    // const onOpacityChange = (value: number) => {
    //     setOpacity(value)
    //     localState.volumeActor.getProperty().setScalarOpacity(0, newOpacityFunction());
    // }

    // function newOpacityFunction() {
    //     var fun = vtkPiecewiseFunction.newInstance();
    //     fun.addPoint(-0, opacity);
    //     return fun;
    // }

    const newColorFunction = () => {
        localState.colorTransferFunction.addRGBPoint(0, red, green, blue);
        return localState.colorTransferFunction;
    }


    return (
        <div className={"slider pt-4"}>
            <h5 className="text-light">RGB</h5>
            <div className="row">
                <h6 className="text-light pr-4">R:</h6>
                <div className={"col-sm-5 text-white flex-start pr-4"}>
                    <Slider
                        min={0}
                        max={255}
                        stepSize={0.1}
                        value={red}
                        labelPrecision={0}
                        onChange={(value) => onRedChange(value)}
                        labelStepSize={255}
                        vertical={false}
                    />
                </div>

            </div>
            <div className="row">
                <h6 className="text-light pr-4">G:</h6>

                <div className={"col-sm-5 text-white flex-start pr-4"}>

                    <Slider
                        min={0}
                        max={255}
                        labelPrecision={0}
                        labelStepSize={255}
                        onChange={(value) => onGreenChange(value)}
                        stepSize={0.1}
                        value={green}
                        vertical={false}
                    />
                </div>
            </div>
            <div className="row">
                <h6 className="text-light pr-4">B:</h6>
                <div className={"col-sm-5 text-white flex-start pr-4"}>

                    <Slider
                        min={0}
                        max={255}
                        stepSize={0.1}
                        value={blue}
                        labelPrecision={0}
                        labelStepSize={255}
                        onChange={(value) => onBlueChange(value)}
                        vertical={false}
                    />
                </div>
            </div>
            {/* <div className="row">
                <h6 className="text-light pr-4">Opacity:</h6>
                <div className={"col-sm-5 text-white flex-start pr-4"}>

                    <Slider
                        min={0}
                        max={1}
                        stepSize={0.1}
                        value={opacity}
                        labelPrecision={0}
                        labelStepSize={1}
                        onChange={(value) => onOpacityChange(value)}
                        vertical={false}
                    />
                </div>
            </div> */}
        </div>
    );

})