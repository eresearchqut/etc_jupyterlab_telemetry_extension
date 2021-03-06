import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';

import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';

import { Token } from '@lumino/coreutils';

import {
  IETCJupyterLabNotebookStateFactory,
  ETCJupyterLabNotebookState
} from "@educational-technology-collective/etc_jupyterlab_notebook_state";

import {
  NotebookSaveEvent,
  CellExecutionEvent,
  NotebookScrollEvent,
  ActiveCellChangeEvent,
  NotebookOpenEvent,
  CellAddEvent,
  CellRemoveEvent,
  CellErrorEvent
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

import { requestAPI } from "./handler";

import { AWSAPIGatewayWrapper } from "@educational-technology-collective/etc_http_aws_api_gateway_wrapper";

const PLUGIN_ID = '@educational-technology-collective/etc_jupyterlab_telemetry_extension:plugin'

export const IETCJupyterLabTelemetryLibraryFactory = new Token<IETCJupyterLabTelemetryLibraryFactory>(PLUGIN_ID);

export interface IETCJupyterLabTelemetryLibraryFactory {

  create(
    { notebookPanel, notebookState }: 
    { notebookPanel: NotebookPanel, notebookState: ETCJupyterLabNotebookState }
    ): ETCJupyterLabTelemetryLibrary;
}

class ETCJupyterLabTelemetryLibraryFactory implements IETCJupyterLabTelemetryLibraryFactory {

  create(
    { notebookPanel, notebookState }: 
    { notebookPanel: NotebookPanel, notebookState: ETCJupyterLabNotebookState }
    ): ETCJupyterLabTelemetryLibrary {
    return new ETCJupyterLabTelemetryLibrary({ notebookPanel, notebookState });
  }
}

export class ETCJupyterLabTelemetryLibrary {

  static _config: object | null;

  public notebookOpenEvent: NotebookOpenEvent;
  public notebookSaveEvent: NotebookSaveEvent;
  public cellExecutionEvent: CellExecutionEvent;
  public cellErrorEvent: CellErrorEvent;
  public notebookScrollEvent: NotebookScrollEvent;
  public activeCellChangeEvent: ActiveCellChangeEvent;
  public cellAddEvent: CellAddEvent;
  public cellRemoveEvent: CellRemoveEvent;

  constructor({
    notebookPanel,
    notebookState
  }: {
    notebookPanel: NotebookPanel,
    notebookState: ETCJupyterLabNotebookState
  }) {


    this.notebookOpenEvent = new NotebookOpenEvent({
      notebookState: notebookState,
      notebookPanel: notebookPanel,
      config: ETCJupyterLabTelemetryLibrary._config
    });

    this.notebookSaveEvent = new NotebookSaveEvent({
      notebookState: notebookState,
      notebookPanel: notebookPanel,
      config: ETCJupyterLabTelemetryLibrary._config
    });

    this.cellExecutionEvent = new CellExecutionEvent({
      notebookState: notebookState,
      notebookPanel: notebookPanel,
      config: ETCJupyterLabTelemetryLibrary._config
    });

    this.cellErrorEvent = new CellErrorEvent({
      notebookState: notebookState,
      notebookPanel: notebookPanel,
      config: ETCJupyterLabTelemetryLibrary._config
    });

    this.notebookScrollEvent = new NotebookScrollEvent({
      notebookState: notebookState,
      notebookPanel: notebookPanel,
      config: ETCJupyterLabTelemetryLibrary._config
    });

    this.activeCellChangeEvent = new ActiveCellChangeEvent({
      notebookState: notebookState,
      notebookPanel: notebookPanel,
      config: ETCJupyterLabTelemetryLibrary._config
    });

    this.cellAddEvent = new CellAddEvent({
      notebookState: notebookState,
      notebookPanel: notebookPanel,
      config: ETCJupyterLabTelemetryLibrary._config
    });

    this.cellRemoveEvent = new CellRemoveEvent({
      notebookState: notebookState,
      notebookPanel: notebookPanel,
      config: ETCJupyterLabTelemetryLibrary._config
    });
  }
}

let awsAPIGatewayWrapper: AWSAPIGatewayWrapper = new AWSAPIGatewayWrapper(
  {
      url: "https://telemetry.qutanalytics.io",
      bucket: "jupyterhub-telemetry",
      path: "jupyter-oncampus",
      retry: 1000,
      errorHandler: console.error
  }
);

async function sendTelemetry(args: object) {
  try {
    // console.log(args)
    let timestamp: number = Date.now();
    await awsAPIGatewayWrapper.requestAsync([args, timestamp]);
    // let response: Response = await awsAPIGatewayWrapper.requestAsync([args, timestamp]);
    // console.log(response)
  }
  catch (e) {
    console.error(e);
  }
}

/**
 * Initialization data for the @educational-technology-collective/etc_jupyterlab_telemetry_extension extension.
 */
const plugin: JupyterFrontEndPlugin<IETCJupyterLabTelemetryLibraryFactory> = {
  id: PLUGIN_ID,
  autoStart: true,
  provides: IETCJupyterLabTelemetryLibraryFactory,
  requires: [INotebookTracker, IETCJupyterLabNotebookStateFactory],
  activate: async (
    app: JupyterFrontEnd,
    notebookTracker: INotebookTracker,
    etcJupyterLabNotebookStateFactory: IETCJupyterLabNotebookStateFactory
  ): Promise<IETCJupyterLabTelemetryLibraryFactory> => {
    let config = null;

    try {
      config = await requestAPI<object>("config");
    }
    catch (e) {
      console.error(e);
    }

    ETCJupyterLabTelemetryLibrary._config = config;

    notebookTracker.widgetAdded.connect(async (sender: INotebookTracker, notebookPanel: NotebookPanel) => {
      await notebookPanel.revealed;
      await notebookPanel.sessionContext.ready;

      let notebookState = etcJupyterLabNotebookStateFactory.create({ notebookPanel });
      let etcJupyterLabTelemetryLibrary = new ETCJupyterLabTelemetryLibrary({ notebookPanel, notebookState });

      etcJupyterLabTelemetryLibrary.notebookOpenEvent.notebookOpened.connect((sender: NotebookOpenEvent, args: any) => sendTelemetry(args));
      etcJupyterLabTelemetryLibrary.notebookSaveEvent.notebookSaved.connect((sender: NotebookSaveEvent, args: any) => sendTelemetry(args));
      etcJupyterLabTelemetryLibrary.activeCellChangeEvent.activeCellChanged.connect((sender: ActiveCellChangeEvent, args: any) => sendTelemetry(args))
      etcJupyterLabTelemetryLibrary.cellAddEvent.cellAdded.connect((sender: CellAddEvent, args: any) => sendTelemetry(args))
      etcJupyterLabTelemetryLibrary.cellRemoveEvent.cellRemoved.connect((sender: CellRemoveEvent, args: any) => sendTelemetry(args))
      etcJupyterLabTelemetryLibrary.notebookScrollEvent.notebookScrolled.connect((sender: NotebookScrollEvent, args: any) => sendTelemetry(args))
      etcJupyterLabTelemetryLibrary.cellExecutionEvent.cellExecuted.connect((sender: CellExecutionEvent, args: any) => sendTelemetry(args))
      etcJupyterLabTelemetryLibrary.cellErrorEvent.cellErrored.connect((sender: CellErrorEvent, args: any) => sendTelemetry(args))
    });

    return new ETCJupyterLabTelemetryLibraryFactory();
  }
};

export default plugin;
