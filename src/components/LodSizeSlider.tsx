
import React from 'react'
import { Slider } from "@blueprintjs/core";
import { observer } from 'mobx-react'

export const LodSizeSlider = observer((props: any) => {
    const { localState } = props //import shared stae from props

    // Adjusting the slider sets teh state variable
    const onSizeChange = (value: number) => {
        localState.setLodMemorySize(value)
    }

    return (
        <div className={"text-white flex-start"}>
            <h6 className="text-light pb-3 mt-5">Select cube memory size (mb)</h6>
            <Slider
                min={0}
                max={100}
                stepSize={1}
                value={localState.lodMemorySize} // Slider value is always set to the shared state variable
                labelPrecision={0}
                onRelease={(value: number) => onSizeChange(value)} // Function that's called when you change the value
                labelStepSize={10}
                vertical={false}
            />
        </div>


    );

})