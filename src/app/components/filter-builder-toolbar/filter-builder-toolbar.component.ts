import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { confirm } from 'devextreme/ui/dialog';

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
  @Input() filters: Record<string, string> = {};
  @Input() selectedKey: string | null = null;
  @Input() queryValue: any = null;

  @Output() selectedKeyChange = new EventEmitter<string | null>();
  @Output() saveRename = new EventEmitter<{ oldKey: string; newKey: string }>();
  @Output() deleteFilter = new EventEmitter<string>();
  @Output() editCanceled = new EventEmitter<void>();

  mode: 'display' | 'edit' = 'display';
  isAddAction: boolean = false;
  copiedValue: string | null = null;

  filterNameControl = new FormControl<string | null>(null);

  get isQueryValueValid(): boolean {
    const val = this.queryValue;
    if (val === null || val === undefined) {
      return false;
    }
    if (Array.isArray(val)) {
      return val.length > 0;
    }
    if (typeof val === 'string') {
      return val.trim().length > 0;
    }
    return true;
  }

  get filterKeys(): string[] {
    return Object.keys(this.filters || {});
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['filters']) {
      this.checkEmptyFilters();
    }
    // Update validation rules whenever filters or selectedKey changes
    this.updateValidation();
  }

  private checkEmptyFilters(): void {
    if (this.filterKeys.length === 0) {
      this.mode = 'edit';
      this.isAddAction = true;
      this.copiedValue = null;
      this.filterNameControl.setValue('Default');
      this.filterNameControl.markAsTouched();
    }
  }

  private updateValidation(): void {
    this.filterNameControl.setValidators([
      Validators.required,
      this.uniqueFilterNameValidator()
    ]);
    this.filterNameControl.updateValueAndValidity();
  }

  uniqueFilterNameValidator(): ValidatorFn {
    return (control: AbstractControl) => {
      const value = (control.value || '').trim().toLowerCase();
      if (!value) {
        return null;
      }

      const isAdding = this.isAddAction || !this.selectedKey;
      const keys = Object.keys(this.filters || {});

      const duplicateExists = keys.some(key => {
        if (!isAdding && key.toLowerCase() === this.selectedKey?.toLowerCase()) {
          return false;
        }
        return key.toLowerCase() === value;
      });

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
    this.filterNameControl.setValue('<default>');
    this.filterNameControl.markAsTouched();
    this.updateValidation();
    this.selectedKeyChange.emit(null);
  }

  enableCopyMode(): void {
    if (this.selectedKey) {
      this.isAddAction = true;
      this.mode = 'edit';
      this.copiedValue = this.filters[this.selectedKey] || null;

      const newKeyName = this.selectedKey + ' Copy';
      this.filterNameControl.setValue(newKeyName);
      this.filterNameControl.markAsTouched();
      this.updateValidation();
    }
  }

  enableEditMode(): void {
    if (this.selectedKey) {
      this.isAddAction = false;
      this.copiedValue = null;
      this.mode = 'edit';
      this.filterNameControl.setValue(this.selectedKey);
      this.filterNameControl.markAsTouched();
      this.updateValidation();
    }
  }

  saveEdit(): void {
    if (this.filterNameControl.invalid || !this.isQueryValueValid) {
      return;
    }

    const value = this.filterNameControl.value;
    const trimmed = (value || '').trim();
    if (!trimmed) {
      return;
    }

    const oldKey = this.isAddAction ? '' : (this.selectedKey || '');

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
      ? (this.filterNameControl.value !== '<default>' && this.filterNameControl.value !== 'Default')
      : (this.filterNameControl.value !== this.selectedKey);

    // Check if query value has changed
    const originalValue = this.isAddAction
      ? (this.copiedValue !== null ? this.copiedValue : null)
      : (this.selectedKey ? (this.filters[this.selectedKey] || null) : null);

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
    if (this.filterKeys.length === 0) {
      this.filterNameControl.setValue('Default');
    } else {
      this.filterNameControl.setValue(null);
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
