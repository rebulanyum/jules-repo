import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import _ from 'lodash';
import { ModalOptions } from '../../services/modal-options';
import { ModalService } from '../../services/modal.service';

@Component({
    selector: 'filter-builder-toolbar',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatSelectModule,
        MatInputModule,
        MatFormFieldModule,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule
    ],
    templateUrl: './filter-builder-toolbar.component.html',
    styleUrls: ['./filter-builder-toolbar.component.scss']
})
export class FilterBuilderToolbarComponent implements OnChanges {
    protected _filters: Record<string, string> = {};
    @Input()
    get filters() {
        return this._filters;
    }
    set filters(value: Record<string, string>) {
        this._filters = value;
        this.filterKeys = new Set(Object.keys(value ?? {}));
    }
    @Input() selectedKey: string | null = null;
    @Input() queryValue: any = null;

    @Output() selectedKeyChange = new EventEmitter<string | null>();
    @Output() saveRename = new EventEmitter<{ oldKey: string; newKey: string }>();
    @Output() deleteFilter = new EventEmitter<string>();
    @Output() editCanceled = new EventEmitter<void>();

    protected _mode: 'display' | 'edit' = 'display';
    private get mode() {
        return this._mode;
    }
    private set mode(value: typeof this._mode) {
        switch(value) {
            case 'display':
                this.filterNameControl.disable();
                break;
            case 'edit':
                this.filterNameControl.enable();
                break;
        }
        this._mode = value;
    }
    isAddAction = false;
    copiedValue: string | null = null;

    filterKeys = new Set<string>();
    filterNameControl = new FormControl<string | null>(null, {
            validators: [Validators.required, this.createUniqueFilterNameValidator()]
    });

    constructor(private modalService: ModalService) {}

    ngOnChanges(changes: SimpleChanges): void {
        const hasFiltersChanged = 'filters' in changes && (changes['filters'].currentValue ?? null) !== (changes['filters'].previousValue ?? null);
        const hasQueryValueChanged = 'queryValue' in changes && (changes['queryValue'].currentValue ?? null) !== (changes['queryValue'].previousValue ?? null);
        const hasSelectedKeyChanged = 'selectedKey' in changes && (changes['selectedKey'].currentValue ?? null) !== (changes['selectedKey'].previousValue ?? null);

        if (hasFiltersChanged || hasQueryValueChanged) {
            if (hasFiltersChanged) {
                this.checkEmptyFilters();
            }
            // Update validation rules whenever filters or selectedKey changes
            this.filterNameControl.updateValueAndValidity();

            if (!hasSelectedKeyChanged) {
                // Prevent auto-selection when selectedKey is null (copy mode)
                if (this.selectedKey === null && this.mode === 'edit' && this.isAddAction) {
                    return;
                }

                if (this.filters && this.queryValue) {
                    const key = Object.keys(this.filters).find(k => _.isEqual(this.filters[k], this.queryValue)) ?? null;

                    if (key === null) {
                        this.mode = 'edit';
                    }

                    if (key !== this.selectedKey) {
                        Promise.resolve().then(() => {
                            this.onSelectionChange(key);
                        });
                    }
                }
            }
        }
    }

    private checkEmptyFilters(): void {
        if (this.filterKeys.size === 0 || this.queryValue) {
            this.mode = 'edit';
            this.isAddAction = true;
            this.copiedValue = null;
            this.filterNameControl.setValue('Default');
            this.filterNameControl.markAsTouched();
            this.filterNameControl.enable();
        } else {
            this.mode = 'display';
            this.isAddAction = false;
            this.copiedValue = null;
        }
    }

    createUniqueFilterNameValidator(): ValidatorFn {
        return (control: AbstractControl) => {
            const value = (control.value || '').trim().toLowerCase();
            if (!value) {
                return null;
            }

            const isAdding = this.isAddAction || !this.selectedKey;
            const duplicateExists = isAdding && this.filterKeys.has(value);

            return duplicateExists ? { duplicate: true } : null;
        };
    }

    onSelectionChange(value: string | null): void {
        this.selectedKey = value;
        this.selectedKeyChange.emit(value);
    }

    enableAddMode(): void {
        this.isAddAction = true;
        this.copiedValue = null;
        this.mode = 'edit';
        this.filterNameControl.setValue('Default');
        this.filterNameControl.markAsTouched();
        this.selectedKey = null; // Do not trigger selectedKeyChange event here to avoid auto-selection of the copied filter
    }

    enableCopyMode(): void {
        if (this.selectedKey) {
            this.isAddAction = true;
            this.mode = 'edit';
            this.copiedValue = this.filters[this.selectedKey] || null;

            const newKeyName = this.selectedKey + ' Copy';
            this.filterNameControl.setValue(newKeyName);
            this.filterNameControl.markAsTouched();
            this.selectedKey = null; // Do not trigger selectedKeyChange event here to avoid auto-selection of the copied filter
        }
    }

    enableEditMode(): void {
        if (this.selectedKey) {
            this.isAddAction = false;
            this.copiedValue = null;
            this.mode = 'edit';
            this.filterNameControl.setValue(this.selectedKey);
            this.filterNameControl.markAsTouched();
        }
    }

    saveEdit(): void {
        if (this.filterNameControl.invalid) {
            return;
        }

        const value = this.filterNameControl.value;
        const trimmed = (value || '').trim();
        if (!trimmed) {
            return;
        }

        const oldKey = this.isAddAction ? '' : this.selectedKey || '';

        this.saveRename.emit({
            oldKey: oldKey,
            newKey: trimmed
        });

        this.isAddAction = false;
        this.copiedValue = null;
        this.filterNameControl.setValue(null);
        this.mode = 'display';
    }

    onCancelClick(): void {
        // Check if key name has changed
        const nameChanged = this.isAddAction
            ? this.filterNameControl.value !== 'Default'
            : this.filterNameControl.value !== this.selectedKey;

        // Check if query value has changed
        const originalValue = this.isAddAction
            ? this.copiedValue !== null
                ? this.copiedValue
                : null
            : this.selectedKey
              ? this.filters[this.selectedKey] || null
              : null;

        const normalize = (val: unknown): string => {
            if (val == null || (Array.isArray(val) && val.length === 0)) {
                return '[]';
            }
            return JSON.stringify(val);
        };

        const valueChanged = normalize(this.queryValue) !== normalize(originalValue);

        if (nameChanged || valueChanged) {
            const modalOptions: ModalOptions = {
                title: 'Are you sure?',
                prompt: 'Are you sure you want to discard your changes?',
                okText: 'Yes',
                cancelText: 'No'
            };

            this.modalService.open(modalOptions).subscribe((x: any) => {
                if (x) this.revertState();
            });
        } else {
            this.revertState();
        }
    }

    private revertState(): void {
        this.isAddAction = false;
        this.copiedValue = null;
        if (this.filterKeys.size === 0) {
            this.filterNameControl.setValue('Default');
        } else {
            this.filterNameControl.setValue(null);
            this.mode = 'display';
        }
        this.editCanceled.emit();
    }

    onDeleteClick(): void {
        if (this.selectedKey) {
            const modalOptions: ModalOptions = {
                title: 'Are you sure?',
                prompt: 'This filter will be deleted for all users, are you sure?',
                okText: 'Yes',
                cancelText: 'No'
            };

            this.modalService.open(modalOptions).subscribe((x: any) => {
                if (x && this.selectedKey) this.deleteFilter.emit(this.selectedKey);
            });
        }
    }
}
