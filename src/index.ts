import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { Token } from '@lumino/coreutils';

import { NotebookState } from "./notebook_state";

import {
  NotebookSaveEvent,
  CellExecutionEvent,
  NotebookScrollEvent,
  ActiveCellChangeEvent,
  NotebookOpenEvent,
  CellAddEvent,
  CellRemoveEvent
} from "./events";

export {
  NotebookSaveEvent,
  CellExecutionEvent,
  NotebookScrollEvent,
  ActiveCellChangeEvent,
  NotebookOpenEvent,
  CellAddEvent,
  CellRemoveEvent
} from "./events";

import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';

import { requestAPI } from "./handler";

const PLUGIN_ID = '@educational-technology-collective/etc_jupyterlab_telemetry_extension:plugin'

export const IETCJupyterLabTelemetry = new Token<IETCJupyterLabTelemetry>(PLUGIN_ID);

export class NotebookEventLibrary {

  static _config: object;

  public notebookOpenEvent: NotebookOpenEvent;
  public notebookSaveEvent: NotebookSaveEvent;
  public cellExecutionEvent: CellExecutionEvent;
  public notebookScrollEvent: NotebookScrollEvent;
  public activeCellChangeEvent: ActiveCellChangeEvent;
  public cellAddEvent: CellAddEvent;
  public cellRemoveEvent: CellRemoveEvent;

  constructor({ notebookPanel }: { notebookPanel: NotebookPanel }) {

    let notebookState = new NotebookState({ notebookPanel: notebookPanel });

    this.notebookOpenEvent = new NotebookOpenEvent({
      notebookState: notebookState,
      notebookPanel: notebookPanel,
      config: NotebookEventLibrary._config
    });

    this.notebookSaveEvent = new NotebookSaveEvent({
      notebookState: notebookState,
      notebookPanel: notebookPanel,
      config: NotebookEventLibrary._config
    });

    this.cellExecutionEvent = new CellExecutionEvent({
      notebookState: notebookState,
      notebookPanel: notebookPanel,
      config: NotebookEventLibrary._config
    });

    this.notebookScrollEvent = new NotebookScrollEvent({
      notebookState: notebookState,
      notebookPanel: notebookPanel,
      config: NotebookEventLibrary._config
    });

    this.activeCellChangeEvent = new ActiveCellChangeEvent({
      notebookState: notebookState,
      notebookPanel: notebookPanel,
      config: NotebookEventLibrary._config
    });

    this.cellAddEvent = new CellAddEvent({
      notebookState: notebookState,
      notebookPanel: notebookPanel,
      config: NotebookEventLibrary._config
    });

    this.cellRemoveEvent = new CellRemoveEvent({
      notebookState: notebookState,
      notebookPanel: notebookPanel,
      config: NotebookEventLibrary._config
    });
  }
}

interface INotebookEventLibraryConstrcutor {
  new({ notebookPanel }: { notebookPanel: NotebookPanel }): NotebookEventLibrary
}

export interface IETCJupyterLabTelemetry {
  NotebookEventLibrary: INotebookEventLibraryConstrcutor
}

/**
 * Initialization data for the @educational-technology-collective/etc_jupyterlab_telemetry_extension extension.
 */
const plugin: JupyterFrontEndPlugin<IETCJupyterLabTelemetry> = {
  id: PLUGIN_ID,
  autoStart: true,
  provides: IETCJupyterLabTelemetry,
  requires: [
    INotebookTracker
  ],
  activate: async (
    app: JupyterFrontEnd,
    notebookTracker: INotebookTracker
  ): Promise<IETCJupyterLabTelemetry> => {

    console.log('JupyterLab extension @educational-technology-collective/etc_jupyterlab_telemetry_extension is activated!');

    let config = await requestAPI<object>("config");

    NotebookEventLibrary._config = config;

    let etcJupyterLabTelemetry: IETCJupyterLabTelemetry = {
      NotebookEventLibrary: NotebookEventLibrary
    }

    // notebookTracker.widgetAdded.connect(async (sender: INotebookTracker, notebookPanel: NotebookPanel) => {

    //   await notebookPanel.revealed;
    //   await notebookPanel.sessionContext.ready;

    //   let notebookEvent = new etcJupyterLabTelemetry.NotebookEventLibrary({ notebookPanel });

    //   notebookEvent.notebookOpenEvent.notebookOpened.connect((sender: NotebookOpenEvent, args: any) => console.log("etc_jupyterlab_telemetry_extension", args));
    //   notebookEvent.notebookSaveEvent.notebookSaved.connect((sender: NotebookSaveEvent, args: any) => console.log("etc_jupyterlab_telemetry_extension", args));
    //   notebookEvent.activeCellChangeEvent.activeCellChanged.connect((sender: ActiveCellChangeEvent, args: any) => console.log("etc_jupyterlab_telemetry_extension", args))
    //   notebookEvent.cellAddEvent.cellAdded.connect((sender: CellAddEvent, args: any) => console.log("etc_jupyterlab_telemetry_extension", args))
    //   notebookEvent.cellRemoveEvent.cellRemoved.connect((sender: CellRemoveEvent, args: any) => console.log("etc_jupyterlab_telemetry_extension", args))
    //   notebookEvent.notebookScrollEvent.notebookScrolled.connect((sender: NotebookScrollEvent, args: any) => console.log("etc_jupyterlab_telemetry_extension", args))
    //   notebookEvent.cellExecutionEvent.cellExecuted.connect((sender: CellExecutionEvent, args: any) => console.log("etc_jupyterlab_telemetry_extension", args))
    // });

    return etcJupyterLabTelemetry;
  }
};

export default plugin;
