import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatSelectModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.css']
})
export class ToolbarComponent {
  @Input() filters: Record<string, string> = {};
  @Input() selectedKey: string | null = null;
  @Output() selectedKeyChange = new EventEmitter<string | null>();

  @Output() saveRename = new EventEmitter<{ oldKey: string; newKey: string }>();
  @Output() deleteFilter = new EventEmitter<string>();

  mode: 'display' | 'edit' = 'display';
  editText: string = '';

  get filterKeys(): string[] {
    return Object.keys(this.filters || {});
  }

  onSelectionChange(value: string | null): void {
    this.selectedKey = value;
    this.selectedKeyChange.emit(value);
  }

  enableEditMode(): void {
    if (this.selectedKey) {
      this.editText = this.selectedKey;
      this.mode = 'edit';
    }
  }

  saveEdit(): void {
    const trimmed = this.editText.trim();
    if (!trimmed) {
      // Prevent saving empty filter name
      return;
    }
    if (this.selectedKey) {
      this.saveRename.emit({
        oldKey: this.selectedKey,
        newKey: trimmed
      });
    }
    this.mode = 'display';
  }

  cancelEdit(): void {
    this.mode = 'display';
  }

  onDeleteClick(): void {
    if (this.selectedKey) {
      this.deleteFilter.emit(this.selectedKey);
    }
  }
}
