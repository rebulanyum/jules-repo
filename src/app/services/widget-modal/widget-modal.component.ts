import { Inject, Component } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ModalOptions } from '../modal-options';

@Component({
	selector: 'aos-widget-modal',
	templateUrl: './widget-modal.component.html',
	styleUrls: ['./widget-modal.component.scss']
})
export class WidgetModalComponent {
	_widgetID: string = 'aos-widget-modal';

	constructor(
        private _dialogHandle: MatDialogRef<WidgetModalComponent>,
        @Inject(MAT_DIALOG_DATA) public _data: ModalOptions,
        private domSanitizer: DomSanitizer
	) { }

    _onOK() {
		this._dialogHandle.close(true);
	}

	_onCancel() {
		this._dialogHandle.close(false);
    }

    getHtml(): SafeHtml{
        if(this._data.html == undefined) return null!;

        return this.domSanitizer.bypassSecurityTrustHtml(this._data.html);
    }
}
