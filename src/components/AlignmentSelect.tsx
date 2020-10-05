import { Alignment, Button, ButtonGroup } from "@blueprintjs/core";
import * as React from "react";

export interface IAlignSelectProps {
    align: Alignment | undefined;
    allowCenter?: boolean;
    label?: string;
    onChange: (align: Alignment) => void;
}

export class AlignmentSelect extends React.PureComponent<IAlignSelectProps> {
    public render() {
        const { align, allowCenter = true } = this.props;
        return (
            <div>
                <ButtonGroup fill={true}>
                    <Button active={align === Alignment.LEFT} text="Max" onClick={this.handleAlignLeft} />
                    {allowCenter && (
                        <Button
                            active={align == null || align === Alignment.CENTER}
                            text="Center"
                            onClick={this.handleAlignCenter}
                            outlined={true}
                        />
                    )}
                    <Button active={align === Alignment.RIGHT} text="Mean" onClick={this.handleAlignRight} />
                </ButtonGroup>
            </div>
        );
    }

    private handleAlignLeft = () => this.props.onChange(Alignment.LEFT);
    private handleAlignCenter = () => this.props.onChange(Alignment.CENTER);
    private handleAlignRight = () => this.props.onChange(Alignment.RIGHT);
}