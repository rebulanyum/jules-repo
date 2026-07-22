import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DxSelectBoxModule } from 'devextreme-angular';
import { confirm } from 'devextreme/ui/dialog';

@Component({
  selector: 'filter-builder-toolbar',
  standalone: true,
  imports: [
    CommonModule,
    DxSelectBoxModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './filter-builder-toolbar.component.html',
  styleUrls: ['./filter-builder-toolbar.component.scss']
})
export class FilterBuilderToolbarComponent implements OnChanges {
  @Input() filters: Record<string, string> = {};
  @Input() selectedKey: string | null = null;
  @Input() queryValue: any = null;

  @Output() selectedKeyChange = new EventEmitter<string | null>();
  @Output() saveRename = new EventEmitter<{ oldKey: string; newKey: string }>();
  @Output() deleteFilter = new EventEmitter<string>();
  @Output() editCanceled = new EventEmitter<void>();

  @ViewChild('editSelectBox', { static: false }) editSelectBox!: any;

  mode: 'display' | 'edit' = 'display';
  isAddAction: boolean = false;
  copiedValue: string | null = null;
  originalSelectedKey: string | null = null;

  isInvalid = false;
  errorMessage: string | null = null;

  filterKeys: string[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['filters']) {
      this.filterKeys = Object.keys(this.filters || {});
      this.checkEmptyFilters();
    }
    if (changes['selectedKey']) {
      if (this.mode === 'edit' && this.isAddAction && !this.originalSelectedKey) {
        if (changes['selectedKey'].currentValue === null) {
          this.selectedKey = '<default>';
        }
      }
    }
  }

  private checkEmptyFilters(): void {
    if (this.filterKeys.length === 0) {
      this.mode = 'edit';
      this.isAddAction = true;
      this.copiedValue = null;
      this.originalSelectedKey = null;
      this.selectedKey = 'Default';
      this.isInvalid = false;
      this.errorMessage = null;
    }
  }

  validateName(name: string): boolean {
    const trimmed = (name || '').trim();
    if (!trimmed) {
      this.isInvalid = true;
      this.errorMessage = 'Filter name is required';
      return false;
    }

    const isAdding = this.isAddAction || !this.originalSelectedKey;
    const duplicateExists = this.filterKeys.some(key => {
      if (!isAdding && key.toLowerCase() === this.originalSelectedKey?.toLowerCase()) {
        return false;
      }
      return key.toLowerCase() === trimmed.toLowerCase();
    });

    if (duplicateExists) {
      this.isInvalid = true;
      this.errorMessage = 'Name must be unique (case-insensitive)';
      return false;
    }

    this.isInvalid = false;
    this.errorMessage = null;
    return true;
  }

  onInput(e: any): void {
    const text = e.event?.target?.value;
    if (text !== undefined) {
      this.selectedKey = text;
      this.validateName(text);
    }
  }

  onSelectionChange(e: any): void {
    const value = e?.value;
    console.log('onSelectionChange called with value:', value, 'event type:', e?.event?.type, 'event:', !!e?.event, 'mode:', this.mode);
    if (this.mode === 'display') {
      this.selectedKey = value;
      this.selectedKeyChange.emit(value);
      return;
    }

    // In edit mode: check if selecting another existing key from list
    const isSelectingAnotherKey = value !== null && e.event !== undefined && this.filterKeys.includes(value) && (this.isAddAction || value !== this.originalSelectedKey);

    if (isSelectingAnotherKey) {
      // Simulate "Cancel" behavior
      const currentInputText = this.selectedKey;
      const previousKey = this.selectedKey;

      setTimeout(() => {
        const defaultAddName = this.originalSelectedKey ? (this.originalSelectedKey + ' Copy') : '<default>';
        const nameChanged = this.isAddAction
          ? (currentInputText !== defaultAddName && currentInputText !== 'Default' && currentInputText !== '')
          : (currentInputText !== this.originalSelectedKey);

        const originalValue = this.isAddAction
          ? (this.copiedValue !== null ? this.copiedValue : null)
          : (this.originalSelectedKey ? (this.filters[this.originalSelectedKey] || null) : null);

        const valueChanged = JSON.stringify(this.queryValue) !== JSON.stringify(originalValue);

        if (nameChanged || valueChanged) {
          confirm('Are you sure you want to discard your changes?', 'Discard Changes').then((confirmed: boolean) => {
            if (confirmed) {
              this.revertStateAndSelect(value);
            } else {
              this.selectedKey = currentInputText || previousKey;
              console.log('REVERT DISCARD - selectedKey to restore:', this.selectedKey);
              setTimeout(() => {
                const instance = this.editSelectBox?.instance;
                console.log('REVERT DISCARD - instance found:', !!instance);
                if (instance) {
                  instance.option('value', this.selectedKey);
                  instance.option('text', this.selectedKey);
                  const inputElement = instance.element().querySelector('.dx-texteditor-input') as HTMLInputElement;
                  console.log('REVERT DISCARD - inputElement found:', !!inputElement, 'old val:', inputElement?.value);
                  if (inputElement) {
                    inputElement.value = this.selectedKey || '';
                    console.log('REVERT DISCARD - inputElement new val:', inputElement.value);
                  }
                }
              }, 0);
            }
          });
        } else {
          this.revertStateAndSelect(value);
        }
      }, 0);
    } else {
      this.selectedKey = value;
      this.validateName(value || '');
    }
  }

  private revertStateAndSelect(newKey: string): void {
    this.isAddAction = false;
    this.copiedValue = null;
    this.isInvalid = false;
    this.errorMessage = null;
    this.mode = 'display';
    this.selectedKey = newKey;
    this.selectedKeyChange.emit(newKey);
  }

  onCustomItemCreating(e: any): void {
    const trimmed = (e.text || '').trim();
    if (this.validateName(trimmed)) {
      e.customItem = trimmed;
      this.selectedKey = trimmed;
    } else {
      e.customItem = null;
    }
  }

  enableAddMode(): void {
    this.isAddAction = true;
    this.copiedValue = null;
    this.originalSelectedKey = null;
    this.selectedKey = '<default>';
    this.isInvalid = false;
    this.errorMessage = null;
    this.mode = 'edit';
    this.selectedKeyChange.emit(null);
  }

  enableCopyMode(): void {
    if (this.selectedKey) {
      this.isAddAction = true;
      this.mode = 'edit';
      this.copiedValue = this.filters[this.selectedKey] || null;
      this.originalSelectedKey = this.selectedKey;

      const newKeyName = this.selectedKey + ' Copy';
      this.selectedKey = newKeyName;
      this.isInvalid = false;
      this.errorMessage = null;
    }
  }

  enableEditMode(): void {
    if (this.selectedKey) {
      this.isAddAction = false;
      this.copiedValue = null;
      this.originalSelectedKey = this.selectedKey;
      this.isInvalid = false;
      this.errorMessage = null;
      this.mode = 'edit';
    }
  }

  saveEdit(): void {
    if (this.isInvalid) {
      return;
    }

    const trimmed = (this.selectedKey || '').trim();
    if (!this.validateName(trimmed)) {
      return;
    }

    const oldKey = this.isAddAction ? '' : (this.originalSelectedKey || '');

    this.saveRename.emit({
      oldKey: oldKey,
      newKey: trimmed
    });

    this.isAddAction = false;
    this.copiedValue = null;
    this.originalSelectedKey = null;
    this.mode = 'display';
  }

  onCancelClick(): void {
    // Check if key name has changed
    const defaultAddName = this.originalSelectedKey ? (this.originalSelectedKey + ' Copy') : '<default>';
    const nameChanged = this.isAddAction
      ? (this.selectedKey !== defaultAddName && this.selectedKey !== 'Default')
      : (this.selectedKey !== this.originalSelectedKey);

    // Check if query value has changed
    const originalValue = this.isAddAction
      ? (this.copiedValue !== null ? this.copiedValue : null)
      : (this.originalSelectedKey ? (this.filters[this.originalSelectedKey] || null) : null);

    const valueChanged = JSON.stringify(this.queryValue) !== JSON.stringify(originalValue);

    if (nameChanged || valueChanged) {
      confirm('Are you sure you want to discard your changes?', 'Discard Changes').then((confirmed: boolean) => {
        if (confirmed) {
          this.revertState();
        }
      });
    } else {
      this.revertState();
    }
  }

  private revertState(): void {
    this.isAddAction = false;
    this.copiedValue = null;
    this.isInvalid = false;
    this.errorMessage = null;
    if (this.filterKeys.length === 0) {
      this.selectedKey = 'Default';
    } else {
      this.selectedKey = this.originalSelectedKey;
      this.mode = 'display';
    }
    this.editCanceled.emit();
  }

  onDeleteClick(): void {
    if (this.selectedKey) {
      this.deleteFilter.emit(this.selectedKey);
    }
  }
}
