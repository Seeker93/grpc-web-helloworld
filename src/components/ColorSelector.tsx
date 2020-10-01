
import React, { useState } from 'react';

import { Button, MenuItem } from "@blueprintjs/core";
import { Select, ItemRenderer, ItemPredicate } from "@blueprintjs/select";
import './ColorSelector.css';

// Select<T> is a generic component to work with your data types.
// In TypeScript, you must first obtain a non-generic reference:

function ColorSelector(props: any) {
    const [selectorText, setSelectorText] = useState("Choose color ...")

    const renderColors: ItemRenderer<any> = (colors, { handleClick, modifiers }) => {
        if (!modifiers.matchesPredicate) {
            return null;
        }
        return (
            <MenuItem
                active={modifiers.active}
                onClick={handleClick}
                text={colors}
                key={colors}
            />
        );
    };

    const filterFile: ItemPredicate<any> = (query, color) => {
        return color.toLowerCase().indexOf(query.toLowerCase()) >= 0;
    };

    const onItemSelected = (item:any)=>{
        setSelectorText(item);
        props.onItemSelected(item);
    }

    return (
        <Select
            items={props.colorMap}
            itemRenderer={renderColors}
            noResults={<MenuItem disabled={true} text="No results." />}
            onItemSelect={(item: any) => onItemSelected(item)}
            itemPredicate={filterFile}
            className={props.className}
        >
            {/* children become the popover target; render value here */}
            <Button text={selectorText} rightIcon="double-caret-vertical" onClick={props.onClick} className={"button-style"}/>
        </Select>
    )
}
export {ColorSelector}