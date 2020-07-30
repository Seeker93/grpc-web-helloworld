import React,{useState} from 'react';

import { Button, MenuItem } from "@blueprintjs/core";
import { Select, ItemRenderer, ItemPredicate} from "@blueprintjs/select";

function FileSelector(props:any) {
    const [selectorText, setSelectorText] = useState("Choose a file ...")
    const FileSelect = Select.ofType<any>();
    
    const renderFile: ItemRenderer<any> = (files, { handleClick, modifiers }) => {
        if (!modifiers.matchesPredicate) {
            return null;
        }
        return (
            <MenuItem
                active={modifiers.active}
                label={parseFloat(files.getFileSize()).toFixed(2).toString() + " mb"}
                onClick={handleClick}
                text={files.getFileName()}
                key={files.getFileName()}
            />
        );
    };

    const filterFile: ItemPredicate<any> = (query, file) => {
        return file.getFileName().toLowerCase().indexOf(query.toLowerCase()) >= 0;
    };

    const onItemSelected = (item:any)=>{
        setSelectorText(item);
        props.onItemSelected(item);
    }

    return (
        <FileSelect
            items={props.files}
            itemRenderer={renderFile}
            noResults={<MenuItem disabled={true} text="No results." />}
            onItemSelect={(item:any) => onItemSelected(item.getFileName())}
            itemPredicate={filterFile}
            className={props.className}
        >
            {/* children become the popover target; render value here */}
            <Button text={selectorText} rightIcon="double-caret-vertical" onClick={props.onClick} />
        </FileSelect>
    )
}
export { FileSelector };