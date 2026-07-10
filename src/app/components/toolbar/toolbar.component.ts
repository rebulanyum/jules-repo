import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-toolbar',
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
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.css']
})
export class ToolbarComponent implements OnChanges {
  @Input() filters: Record<string, string> = {};
  @Input() selectedKey: string | null = null;
  @Output() selectedKeyChange = new EventEmitter<string | null>();

  @Output() saveRename = new EventEmitter<{ oldKey: string; newKey: string; customValue?: string }>();
  @Output() deleteFilter = new EventEmitter<string>();

  mode: 'display' | 'edit' = 'display';
  isAddAction: boolean = false;
  copiedValue: string | null = null;

  filterNameControl = new FormControl('', { nonNullable: true });

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
    if (this.filterNameControl.invalid) {
      return;
    }

    const trimmed = this.filterNameControl.value.trim();
    if (!trimmed) {
      return;
    }

    const oldKey = this.isAddAction ? '' : (this.selectedKey || '');
    this.saveRename.emit({
      oldKey: oldKey,
      newKey: trimmed,
      customValue: this.copiedValue || undefined
    });

    this.isAddAction = false;
    this.copiedValue = null;
    this.mode = 'display';
  }

  cancelEdit(): void {
    this.isAddAction = false;
    this.copiedValue = null;
    if (this.filterKeys.length === 0) {
      this.filterNameControl.setValue('Default');
    } else {
      this.mode = 'display';
    }
  }

  onDeleteClick(): void {
    if (this.selectedKey) {
      this.deleteFilter.emit(this.selectedKey);
    }
  }
}
