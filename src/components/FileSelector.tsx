import React,{useState} from 'react';

import { Button, MenuItem } from "@blueprintjs/core";
import { Select, ItemRenderer, ItemPredicate} from "@blueprintjs/select";

function FileSelector(props:any) {
    const [selectorText, setSelectorText] = useState("Choose a file ...")
    const FileSelect = Select.ofType<any>();
    
    const renderFilm: ItemRenderer<any> = (files, { handleClick, modifiers }) => {
        if (!modifiers.matchesPredicate) {
            return null;
        }
        return (
            <MenuItem
                active={modifiers.active}
                label={files}
                onClick={handleClick}
                text={files}
                key={files}
            />
        );
    };

    const filterFile: ItemPredicate<any> = (query, file) => {
        return file.toLowerCase().indexOf(query.toLowerCase()) >= 0;
    };

    const onItemSelected = (item:any)=>{
        setSelectorText(item);
        props.onItemSelected(item);
    }

    return (
        <FileSelect
            items={props.files}
            itemRenderer={renderFilm}
            noResults={<MenuItem disabled={true} text="No results." />}
            onItemSelect={(item:any) => onItemSelected(item)}
            itemPredicate={filterFile}
        >
            {/* children become the popover target; render value here */}
            <Button text={selectorText} rightIcon="double-caret-vertical" onClick={props.onClick} />
        </FileSelect>
    )
}
export { FileSelector };