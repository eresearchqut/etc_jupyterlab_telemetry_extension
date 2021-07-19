import {
    NotebookPanel,
    Notebook
} from "@jupyterlab/notebook";

import {
    Cell,
    CodeCell,
    ICellModel
} from "@jupyterlab/cells";

import {
    IObservableList,
    IObservableUndoableList,
    IObservableString
} from "@jupyterlab/observables";

import { IOutputAreaModel } from "@jupyterlab/outputarea";

import { INotebookContent } from "@jupyterlab/nbformat";

export class NotebookState {

    private _notebook: Notebook;
    private _cellState: WeakMap<Cell<ICellModel>, { changed: boolean, output: string }>;
    private _seq: number;

    constructor({ notebookPanel }: { notebookPanel: NotebookPanel }) {

        this._notebook = notebookPanel.content;
        this._cellState = new WeakMap<Cell<ICellModel>, { changed: boolean, output: string }>();
        this._seq = 0;

        this.updateCellState();
        //  The notebook loaded; hence, update the cell state.

        this._notebook.model?.cells.changed.connect((
            sender: IObservableUndoableList<ICellModel>,
            args: IObservableList.IChangedArgs<ICellModel>
        ) => {

            if (args.type == "add") {

                this.updateCellState();
                //  A cell was added; hence, update the cell state.
            }
        }, this);
    }

    private updateCellState() {

        this._notebook.widgets.forEach((cell: Cell<ICellModel>) => {

            if (!this._cellState.has(cell)) {

                this._cellState.set(cell, { changed: true, output: this.createCellOutput(cell) });
                //  It's a new cell; hence, the changed state is set to true.

                ////  This is a new cell; hence, add handlers that check for changes in the inputs and outputs.
                cell.inputArea.model.value.changed.connect(
                    (sender: IObservableString, args: IObservableString.IChangedArgs) => {
                        let state = this._cellState.get(cell);
                        if (state !== undefined) {
                            state.changed = true;
                            //  The input area changed; hence, the changed state is set to true.
                        }
                    });

                if (cell.model.type == "code") {

                    (cell as CodeCell).model.outputs.changed.connect(
                        (sender: IOutputAreaModel, args: IOutputAreaModel.ChangedArgs
                        ) => {
                            if (args.type == "add") {
                                //  An output has been added to the cell; hence, compare the current state with the new state.
                                let state = this._cellState.get(cell);
                                if (state !== undefined) {
                                    let output = this.createCellOutput(cell);
                                    if (output !== state?.output) {
                                        //  The output has changed; hence, set changed to true and update the output state.
                                        state.changed = true;
                                        state.output = output;
                                    }
                                    else {
                                        //  The output hasn't changed; hence, leave the state as is.
                                    }
                                }
                            }
                        });
                }
            }
        });
    }

    private createCellOutput(cell: Cell<ICellModel>) {
        //  Combine the cell outputs into a string in order to check for changes.

        let output = "";

        if (cell.model.type == "code") {

            let outputs = (cell as CodeCell).model.outputs;

            for (let index = 0; index < outputs.length; index++) {

                for (let key of Object.keys(outputs.get(index).data).sort()) {
                    output = output + JSON.stringify(outputs.get(index).data[key]);
                }
            }
            return output;
        }

        return "";
    }

    getNotebookState(): { notebook: INotebookContent, seq: number } {

        let nbFormatNotebook = (this._notebook.model?.toJSON() as INotebookContent);

        for (let index = 0; index < this._notebook.widgets.length; index++) {

            let cell: Cell<ICellModel> = this._notebook.widgets[index];

            if (this._cellState.get(cell)?.changed === false) {
                //  The cell has not changed; hence, the notebook format cell will contain just its id.

                (nbFormatNotebook.cells[index] as any) = { id: this._notebook.widgets[index].model.id };
            }
        }

        this._notebook.widgets.forEach((cell: Cell<ICellModel>) => {
            let cellState = this._cellState.get(cell);
            if (cellState !== undefined) {
                cellState.changed = false;
                //  The cell state has been captured; hence, set all states to not changed.
            }
        });

        let state = {
            notebook: nbFormatNotebook,
            seq: this._seq
        }

        this._seq = this._seq + 1;

        return state;
    }
}
