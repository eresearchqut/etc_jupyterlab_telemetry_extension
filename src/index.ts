import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { ISettingRegistry } from '@jupyterlab/settingregistry';

import { Signal } from '@lumino/signaling';

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
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';

const PLUGIN_ID = '@educational-technology-collective/etc_jupyterlab_telemetry_extension:plugin'

export const INotebookEvent = new Token<INotebookEvent>(PLUGIN_ID);

export interface INotebookEvent {
  notebookSaved: Signal<SignalMuxer, any>;
  cellExecuted: Signal<SignalMuxer, any>;
  notebookScrolled: Signal<SignalMuxer, any>;
  activeCellChanged: Signal<SignalMuxer, any>;
  notebookOpened: Signal<SignalMuxer, any>;
  cellAdded: Signal<SignalMuxer, any>;
  cellRemoved: Signal<SignalMuxer, any>;
}

class SignalMuxer implements INotebookEvent {

  public notebookSaved = new Signal<SignalMuxer, any>(this);
  public cellExecuted = new Signal<SignalMuxer, any>(this);
  public notebookScrolled = new Signal<SignalMuxer, any>(this);
  public activeCellChanged = new Signal<SignalMuxer, any>(this);
  public notebookOpened = new Signal<SignalMuxer, any>(this);
  public cellAdded = new Signal<SignalMuxer, any>(this);
  public cellRemoved = new Signal<SignalMuxer, any>(this);

  constructor() { }
}

/**
 * Initialization data for the @educational-technology-collective/etc_jupyterlab_telemetry_extension extension.
 */
const plugin: JupyterFrontEndPlugin<INotebookEvent> = {
  id: PLUGIN_ID,
  autoStart: true,
  provides: INotebookEvent,
  requires: [
    INotebookTracker,
    ISettingRegistry
  ],
  activate: async (
    app: JupyterFrontEnd,
    notebookTracker: INotebookTracker,
    settingRegistry: ISettingRegistry
  ): Promise<INotebookEvent> => {

    console.log('JupyterLab extension @educational-technology-collective/etc_jupyterlab_telemetry_extension is activated!');

    let signalMuxer = new SignalMuxer();

    let settings: ISettingRegistry.ISettings;

    settings = await settingRegistry.load(PLUGIN_ID); // in order to get settings.

    notebookTracker.widgetAdded.connect(async (sender: INotebookTracker, notebookPanel: NotebookPanel) => {

      await notebookPanel.revealed;
      await notebookPanel.sessionContext.ready;

      let notebookState = new NotebookState({ notebookPanel: notebookPanel });

      let notebookSaveEvent = new NotebookSaveEvent({
        notebookState: notebookState,
        notebookPanel: notebookPanel,
        settings
      });
      
      notebookSaveEvent.notebookSaved.connect((sender: NotebookSaveEvent, args: any) => {
        signalMuxer.notebookSaved.emit(args);
      });

      let cellExecutionEvent = new CellExecutionEvent({
        notebookState: notebookState,
        notebookPanel: notebookPanel,
        settings
      });
      cellExecutionEvent.cellExecuted.connect((sender: CellExecutionEvent, args: any) => {
        signalMuxer.cellExecuted.emit(args);
      });

      let notebookScrollEvent = new NotebookScrollEvent({
        notebookState: notebookState,
        notebookPanel: notebookPanel,
        settings
      });
      notebookScrollEvent.notebookScrolled.connect((sender: NotebookScrollEvent, args: any) => {
        signalMuxer.notebookScrolled.emit(args);
      });

      let activeCellChangeEvent = new ActiveCellChangeEvent({
        notebookState: notebookState,
        notebookPanel: notebookPanel,
        settings
      });
      activeCellChangeEvent.activeCellChanged.connect((sender: ActiveCellChangeEvent, args: any) => {
        signalMuxer.activeCellChanged.emit(args);
      });

      let notebookOpenEvent = new NotebookOpenEvent({
        notebookState: notebookState,
        notebookPanel: notebookPanel,
        settings
      });
      notebookOpenEvent.notebookOpened.connect((sender: NotebookOpenEvent, args: any) => {
        signalMuxer.notebookOpened.emit(args);
      });

      let cellAddEvent = new CellAddEvent({
        notebookState: notebookState,
        notebookPanel: notebookPanel,
        settings
      });
      cellAddEvent.cellAdded.connect((sender: CellAddEvent, args: any) => {
        signalMuxer.cellAdded.emit(args);
      });

      let cellRemoveEvent = new CellRemoveEvent({
        notebookState: notebookState,
        notebookPanel: notebookPanel,
        settings
      });
      cellRemoveEvent.cellRemoved.connect((sender: CellRemoveEvent, args: any) => {
        signalMuxer.cellRemoved.emit(args);
      });      
    });

    return signalMuxer;
  }
};

export default plugin;
