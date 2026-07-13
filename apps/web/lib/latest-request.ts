export class LatestRequest {
  private active: AbortController | undefined;

  start(): AbortController {
    this.active?.abort();
    const controller = new AbortController();
    this.active = controller;
    return controller;
  }

  isCurrent(controller: AbortController): boolean {
    return this.active === controller;
  }

  finish(controller: AbortController): boolean {
    if (!this.isCurrent(controller)) return false;
    this.active = undefined;
    return true;
  }

  cancel(): void {
    this.active?.abort();
    this.active = undefined;
  }
}
