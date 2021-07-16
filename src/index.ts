import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { ISettingRegistry } from '@jupyterlab/settingregistry';

import { requestAPI } from './handler';

import { ISignal, Signal } from '@lumino/signaling';

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
}

class SignalMuxer implements INotebookEvent {

  public notebookSaved = new Signal<SignalMuxer, any>(this);

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

      notebookSaveEvent.notebookSaved.connect((sender: NotebookSaveEvent, args: any) => { signalMuxer.notebookSaved.emit.call(sender, args) });
    
    });

    return signalMuxer;
  }
};

export default plugin;
