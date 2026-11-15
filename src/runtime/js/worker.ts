import { runJsProgram, type JsProgramRequest, type JsProgramResult } from './program';

interface MinimalWorkerScope {
  onmessage: ((event: MessageEvent<JsProgramRequest>) => void) | null;
  postMessage: (message: JsProgramResult) => void;
}

const scope = self as unknown as MinimalWorkerScope;

scope.onmessage = (event) => {
  scope.postMessage(runJsProgram(event.data));
};
