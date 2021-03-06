import {
    NotebookPanel,
    INotebookModel,
    Notebook,
    NotebookActions
} from "@jupyterlab/notebook";

import { 
    ISignal, 
    Signal 
} from '@lumino/signaling';

import {
    Cell,
    ICellModel
} from "@jupyterlab/cells";

import {
    IObservableList,
    IObservableUndoableList
} from "@jupyterlab/observables";

import {
    DocumentRegistry
} from "@jupyterlab/docregistry";

import { IMessage, MessageType } from "@jupyterlab/services/lib/kernel/messages";

import {ETCJupyterLabNotebookState as NotebookState} from "@educational-technology-collective/etc_jupyterlab_notebook_state";

import { ConfigSupplicant } from "./config_supplicant";


export interface ICellMeta {
    index: number;
    id: any;
}

interface INotebookEventOptions {
    notebookState: NotebookState;
    notebookPanel: NotebookPanel;
    config: object | null;
}

export class NotebookSaveEvent extends ConfigSupplicant {

    private _notebookSaved: Signal<NotebookSaveEvent, any> = new Signal(this);
    private _notebookPanel: NotebookPanel;
    private _notebookState: NotebookState;

    constructor({ notebookState, notebookPanel, config }: INotebookEventOptions) {
        super({
            paths: ["mentoracademy.org/schemas/events/1.0.0/NotebookSaveEvent", "enable"],
            config
        });

        this._notebookState = notebookState;
        this._notebookPanel = notebookPanel;

        notebookPanel.disposed.connect(this.dispose, this);
    }

    dispose() {
        Signal.disconnectAll(this);
    }

    private event(
        context: DocumentRegistry.IContext<INotebookModel>,
        saveState: DocumentRegistry.SaveState
    ): void {

        let cell: Cell<ICellModel>;
        let cells: Array<ICellMeta>;
        let index: number;

        if (saveState.match("completed")) {

            cells = [];

            for (index = 0; index < this._notebookPanel.content.widgets.length; index++) {

                cell = this._notebookPanel.content.widgets[index];

                if (this._notebookPanel.content.isSelectedOrActive(cell)) {

                    cells.push({ id: cell.model.id, index });
                }
            }

            let notebookState = this._notebookState.getNotebookState();

            this._notebookSaved.emit({
                event_name: "save_notebook",
                cells: cells,
                notebook: notebookState.notebook,
                session_id: notebookState.session_id,
                seq: notebookState.seq,
                notebook_path: this._notebookPanel.context.path
            });
        }
    }

    public enable(): void {
        this._notebookPanel.context.saveState.connect(this.event, this);
    }

    public disable(): void {
        this._notebookPanel.context.saveState.disconnect(this.event, this);
    }

    get notebookSaved(): ISignal<NotebookSaveEvent, any> {
        return this._notebookSaved
    }
}

export class CellExecutionEvent extends ConfigSupplicant {

    private _cellExecuted: Signal<CellExecutionEvent, any> = new Signal(this);
    private _notebookPanel: NotebookPanel;
    private _notebook: Notebook;
    private _notebookState: NotebookState;


    constructor({ notebookState, notebookPanel, config }: INotebookEventOptions) {
        super({
            paths: ["mentoracademy.org/schemas/events/1.0.0/CellExecutionEvent", "enable"],
            config
        });

        this._notebookState = notebookState;
        this._notebookPanel = notebookPanel;
        this._notebook = notebookPanel.content;

        notebookPanel.disposed.connect(this.dispose, this);
    }

    dispose() {
        Signal.disconnectAll(this);
    }

    private event(_: any, args: { notebook: Notebook; cell: Cell<ICellModel> }): void {

        if (args.notebook.model === this._notebook.model) {

            let cells = [
                {
                    id: args.cell.model.id,
                    index: this._notebook.widgets.findIndex((value: Cell<ICellModel>) => value == args.cell)
                }
            ]

            let notebookState = this._notebookState.getNotebookState();

            this._cellExecuted.emit({
                event_name: "cell_executed",
                cells: cells,
                notebook: notebookState.notebook,
                session_id: notebookState.session_id,
                seq: notebookState.seq,
                notebook_path: this._notebookPanel.context.path
            });
        }
    }

    public enable(): void {
        NotebookActions.executed.connect(this.event, this);
    }

    public disable(): void {
        NotebookActions.executed.disconnect(this.event, this);
    }

    get cellExecuted(): ISignal<CellExecutionEvent, any> {
        return this._cellExecuted
    }
}


export class NotebookScrollEvent extends ConfigSupplicant {

    private _notebookScrolled: Signal<NotebookScrollEvent, any> = new Signal(this);
    private _notebookPanel: NotebookPanel;
    private _notebook: Notebook;
    private _notebookState: NotebookState;

    private _timeout: number;

    constructor({ notebookState, notebookPanel, config }: INotebookEventOptions) {
        super({
            paths: ["mentoracademy.org/schemas/events/1.0.0/NotebookScrollEvent", "enable"],
            config
        });

        this._notebookState = notebookState;
        this._notebookPanel = notebookPanel;
        this._notebook = notebookPanel.content;
        this._timeout = 0;

        this.event = this.event.bind(this);

        notebookPanel.disposed.connect(this.dispose, this);
    }

    dispose() {
        Signal.disconnectAll(this);
    }

    private event(e: Event): void {

        e.stopPropagation();

        clearTimeout(this._timeout);

        this._timeout = setTimeout(() => {

            let cells: Array<ICellMeta> = [];
            let cell: Cell<ICellModel>;
            let index: number;
            let id: string;

            for (index = 0; index < this._notebook.widgets.length; index++) {

                cell = this._notebook.widgets[index];

                let cellTop = cell.node.offsetTop;
                let cellBottom = cell.node.offsetTop + cell.node.offsetHeight;
                let viewTop = this._notebook.node.scrollTop;
                let viewBottom = this._notebook.node.scrollTop + this._notebook.node.clientHeight;

                if (cellTop > viewBottom || cellBottom < viewTop) {
                    continue;
                }

                id = cell.model.id;

                cells.push({ id, index });
            }

            let notebookState = this._notebookState.getNotebookState();

            this._notebookScrolled.emit({
                event_name: "scroll",
                cells: cells,
                notebook: notebookState.notebook,
                session_id: notebookState.session_id,
                seq: notebookState.seq,
                notebook_path: this._notebookPanel.context.path
            });

        }, 1000);
    }

    public enable(): void {
        this._notebook.node.addEventListener("scroll", this.event, false);
    }

    public disable(): void {
        this._notebook.node.removeEventListener("scroll", this.event, false);
    }

    get notebookScrolled(): ISignal<NotebookScrollEvent, any> {
        return this._notebookScrolled;
    }
}

export class ActiveCellChangeEvent extends ConfigSupplicant {

    private _activeCellChanged: Signal<ActiveCellChangeEvent, any> = new Signal(this);
    private _notebookPanel: NotebookPanel;
    private _notebook: Notebook;
    private _notebookState: NotebookState;


    constructor({ notebookState, notebookPanel, config }: INotebookEventOptions) {
        super({
            paths: ["mentoracademy.org/schemas/events/1.0.0/ActiveCellChangeEvent", "enable"],
            config
        });

        this._notebookState = notebookState;
        this._notebookPanel = notebookPanel;
        this._notebook = notebookPanel.content;

        notebookPanel.disposed.connect(this.dispose, this);
    }

    dispose() {
        Signal.disconnectAll(this);
    }

    private event(send: Notebook, args: Cell<ICellModel>): void {

        let cells = [
            {
                id: args.model.id,
                index: this._notebook.widgets.findIndex((value: Cell<ICellModel>) => value == args)
            }
        ];

        let notebookState = this._notebookState.getNotebookState();

        this._activeCellChanged.emit({
            event_name: "active_cell_changed",
            cells: cells,
            notebook: notebookState.notebook,
            session_id: notebookState.session_id,
            seq: notebookState.seq,
            notebook_path: this._notebookPanel.context.path
        });
    }

    public enable(): void {
        this._notebook.activeCellChanged.connect(this.event, this);
    }

    public disable(): void {
        this._notebook.activeCellChanged.disconnect(this.event, this);
    }

    get activeCellChanged(): ISignal<ActiveCellChangeEvent, any> {
        return this._activeCellChanged;
    }
}

export class NotebookOpenEvent extends ConfigSupplicant {

    private _notebookOpened: Signal<NotebookOpenEvent, any> = new Signal(this);
    private _notebookPanel: NotebookPanel;
    private _notebook: Notebook;
    private _notebookState: NotebookState;
    private _enable: boolean;


    constructor({ notebookState, notebookPanel, config }: INotebookEventOptions) {
        super({
            paths: ["mentoracademy.org/schemas/events/1.0.0/NotebookOpenEvent", "enable"],
            config
        });

        this._notebookState = notebookState;
        this._notebookPanel = notebookPanel;
        this._notebook = notebookPanel.content;
        this._enable = false;

        setTimeout(this.event.bind(this));

        notebookPanel.disposed.connect(this.dispose, this);
    }

    dispose() {
        Signal.disconnectAll(this);
    }

    private event(): void {

        if (!this._enable) {
            return;
        }

        let cells = this._notebook.widgets.map((cell: Cell<ICellModel>, index: number) =>
            ({ id: cell.model.id, index: index })
        );

        let notebookState = this._notebookState.getNotebookState();

        this._notebookOpened.emit({
            event_name: "open_notebook",
            cells: cells,
            notebook: notebookState.notebook,
            session_id: notebookState.session_id,
            seq: notebookState.seq,
            notebook_path: this._notebookPanel.context.path
        });
    }

    public enable(): void {
        this._enable = true;
    }

    public disable(): void {
        this._enable = false;
    }

    get notebookOpened(): ISignal<NotebookOpenEvent, any> {
        return this._notebookOpened
    }
}

export class CellAddEvent extends ConfigSupplicant {

    private _cellAdded: Signal<CellAddEvent, any> = new Signal(this);
    private _notebookPanel: NotebookPanel;
    private _notebook: Notebook;
    private _notebookState: NotebookState;


    constructor({ notebookState, notebookPanel, config }: INotebookEventOptions) {
        super({
            paths: ["mentoracademy.org/schemas/events/1.0.0/CellAddEvent", "enable"],
            config
        });

        this._notebookState = notebookState;
        this._notebookPanel = notebookPanel;
        this._notebook = notebookPanel.content;

        notebookPanel.disposed.connect(this.dispose, this);
    }

    dispose() {
        Signal.disconnectAll(this);
    }

    private event(
        sender: IObservableUndoableList<ICellModel>,
        args: IObservableList.IChangedArgs<ICellModel>) {

        if (args.type == "add") {

            let cells = [{ id: args.newValues[0].id, index: args.newIndex }];

            let notebookState = this._notebookState.getNotebookState();

            this._cellAdded.emit({
                event_name: "add_cell",
                cells: cells,
                notebook: notebookState.notebook,
                session_id: notebookState.session_id,
                seq: notebookState.seq,
                notebook_path: this._notebookPanel.context.path
            });
        }
    }

    public enable(): void {
        this._notebook.model?.cells.changed.connect(this.event, this);
    }

    public disable(): void {
        this._notebook.model?.cells.changed.disconnect(this.event, this);
    }

    get cellAdded(): ISignal<CellAddEvent, any> {
        return this._cellAdded
    }
}


export class CellRemoveEvent extends ConfigSupplicant {

    private _cellRemoved: Signal<CellRemoveEvent, any> = new Signal(this);
    private _notebookPanel: NotebookPanel;
    private _notebook: Notebook;
    private _notebookState: NotebookState;


    constructor({ notebookState, notebookPanel, config }: INotebookEventOptions) {
        super({
            paths: ["mentoracademy.org/schemas/events/1.0.0/CellRemoveEvent", "enable"],
            config
        });

        this._notebookState = notebookState;
        this._notebookPanel = notebookPanel;
        this._notebook = notebookPanel.content;


        notebookPanel.disposed.connect(this.dispose, this);
    }

    dispose() {
        Signal.disconnectAll(this);
    }

    private event(
        sender: IObservableUndoableList<ICellModel>,
        args: IObservableList.IChangedArgs<ICellModel>) {

        if (args.type == "remove") {

            let cells = [{ id: args.oldValues[0].id, index: args.oldIndex }];

            let notebookState = this._notebookState.getNotebookState();

            this._cellRemoved.emit({
                event_name: "remove_cell",
                cells: cells,
                notebook: notebookState.notebook,
                session_id: notebookState.session_id,
                seq: notebookState.seq,
                notebook_path: this._notebookPanel.context.path
            });
        }
    }

    public enable(): void {
        this._notebook.model?.cells.changed.connect(this.event, this);
    }

    public disable(): void {
        this._notebook.model?.cells.changed.disconnect(this.event, this);
    }

    get cellRemoved(): ISignal<CellRemoveEvent, any> {
        return this._cellRemoved
    }
}

export class CellErrorEvent extends ConfigSupplicant {

    private _cellErrored: Signal<CellErrorEvent, any> = new Signal(this);
    private _notebookPanel: NotebookPanel;
    private _notebookState: NotebookState;


    constructor({ notebookState, notebookPanel, config }: INotebookEventOptions) {
        super({
            paths: ["mentoracademy.org/schemas/events/1.0.0/CellErrorEvent", "enable"],
            config
        });

        this._notebookState = notebookState;
        this._notebookPanel = notebookPanel;

        notebookPanel.disposed.connect(this.dispose, this);
    }

    dispose() {
        Signal.disconnectAll(this);
    }

    private event(_: any, args: IMessage<MessageType>): void {

        if (args.header.msg_type == "error") {

            let cells = [
                {
                    id: this._notebookPanel.content.activeCell?.model.id,
                    index: this._notebookPanel.content.activeCellIndex
                }
            ]

            let notebookState = this._notebookState.getNotebookState();

            this._cellErrored.emit({
                event_name: "cell_errored",
                cells: cells,
                notebook: notebookState.notebook,
                session_id: notebookState.session_id,
                seq: notebookState.seq,
                notebook_path: this._notebookPanel.context.path
            });
        }
    }

    public enable(): void {
        this._notebookPanel.sessionContext.iopubMessage.connect(this.event, this);
    }

    public disable(): void {
        this._notebookPanel.sessionContext.iopubMessage.disconnect(this.event, this);
    }

    get cellErrored(): ISignal<CellErrorEvent, any> {
        return this._cellErrored
    }
}