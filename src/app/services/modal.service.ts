import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ModalOptions } from './modal-options';
import { WidgetModalComponent } from './widget-modal/widget-modal.component';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  constructor(
      private _dialog: MatDialog
  ) { }

  /**
   * @deprecated Use open(options: ModalOptions) instead
   */
  public showCustomHtml(title: string, html: string, okText?: string, cancelText?: string): Observable<boolean> {

      let handle = this.openModal({ title: title, okText: okText, cancelText: cancelText, html: html });
  return handle.afterClosed().pipe(map(r => r as boolean));
}
  /**
   * @deprecated Use open(options: ModalOptions) instead
   */
  public showCustom(title: string, prompt: string, okText?: string, cancelText?: string): Observable<boolean> {
  let handle = this.openModal({ title: title, okText: okText, cancelText: cancelText, prompt: prompt });
  return handle.afterClosed().pipe(map(r => r as boolean));
}

   /**
   * @deprecated Use open(options: ModalOptions) instead
   */
  public show(title: string, prompt: string){
      return this.showCustom(title, prompt, 'Ok', 'Cancel');
  }

  public open(options: ModalOptions){
      let handle = this.openModal(options);
  return handle.afterClosed().pipe(map(r => r as boolean));
  }

private openModal(options: ModalOptions): MatDialogRef<WidgetModalComponent> {
  var _dialogHandle = this._dialog.open(WidgetModalComponent, {
          data: options
  });
  return _dialogHandle;
}
}
